'use strict';

/* ================================================================ *
 *  Painel LED dot-matrix REAL                                       *
 *  Uma única grade uniforme de pontos; os dígitos são os pontos     *
 *  acesos dessa mesma grade (por isso alinham perfeitamente).       *
 * ================================================================ */

// Segmentos num dígito 7-seg desenhado numa célula de 5 col x 9 linhas
const DW = 5, DH = 9, GAP = 2;

function hcells(c0, c1, r) { const o = []; for (let c = c0; c <= c1; c++) o.push([c, r]); return o; }
function vcells(c, r0, r1) { const o = []; for (let r = r0; r <= r1; r++) o.push([c, r]); return o; }

const SEG_CELLS = {
  a: hcells(0, 4, 0), // topo
  g: hcells(0, 4, 4), // meio
  d: hcells(0, 4, 8), // base
  f: vcells(0, 0, 4), // sup-esq
  b: vcells(4, 0, 4), // sup-dir
  e: vcells(0, 4, 8), // inf-esq
  c: vcells(4, 4, 8), // inf-dir
};

// Quais segmentos acendem para cada caractere
const SEG_MAP = {
  '0': ['a', 'b', 'c', 'd', 'e', 'f'],
  '1': ['b', 'c'],
  '2': ['a', 'b', 'g', 'e', 'd'],
  '3': ['a', 'b', 'g', 'c', 'd'],
  '4': ['f', 'g', 'b', 'c'],
  '5': ['a', 'f', 'g', 'c', 'd'],
  '6': ['a', 'f', 'g', 'e', 'c', 'd'],
  '7': ['a', 'b', 'c'],
  '8': ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
  '9': ['a', 'b', 'c', 'd', 'f', 'g'],
  '-': ['g'],
  ' ': [],
};

// Renderiza o painel inteiro (campo + dígitos) dentro de `container`.
// Recalcula a grade a partir do tamanho em px do container (crisp em qualquer escala).
function renderDisplay(container, value) {
  const w = container.clientWidth, h = container.clientHeight;
  if (!w || !h) return;

  const chars = String(Math.max(0, Math.floor(value))).split('');
  const n = chars.length;
  const totalCols = n * DW + (n - 1) * GAP;

  // pitch limitado pela ALTURA (dígitos ~80% da altura) E pela LARGURA
  // (o número tem que caber com 1 coluna de folga de cada lado)
  const pitchH = h * 0.82 / DH;
  const pitchW = w / (totalCols + 2);
  const pitch = Math.max(7, Math.min(pitchH, pitchW));

  const cols = Math.floor(w / pitch);
  const rows = Math.floor(h / pitch);
  const offX = (w - cols * pitch) / 2 + pitch / 2;
  const offY = (h - rows * pitch) / 2 + pitch / 2;

  const startCol = Math.round((cols - totalCols) / 2);
  const startRow = Math.max(0, Math.round((rows - DH) / 2));

  // conjunto de células acesas
  const lit = new Set();
  chars.forEach((ch, i) => {
    const base = startCol + i * (DW + GAP);
    (SEG_MAP[ch] || []).forEach((seg) => {
      SEG_CELLS[seg].forEach(([c, r]) => lit.add((base + c) + ',' + (startRow + r)));
    });
  });

  const rOff = (pitch * 0.15).toFixed(2);
  const rOn = (pitch * 0.34).toFixed(2);
  let off = '', on = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = (offX + c * pitch).toFixed(2);
      const cy = (offY + r * pitch).toFixed(2);
      if (lit.has(c + ',' + r)) on += `<circle cx="${cx}" cy="${cy}" r="${rOn}"/>`;
      else off += `<circle cx="${cx}" cy="${cy}" r="${rOff}"/>`;
    }
  }

  container.innerHTML =
    `<svg class="matrix-svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="none">`
    + `<g class="off-layer">${off}</g>`
    + `<g class="on-layer">${on}</g>`
    + `</svg>`;
}

window.LED = { renderDisplay };
