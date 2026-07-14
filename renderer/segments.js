'use strict';

/* ================================================================ *
 *  Dígitos LED dot-matrix (7 segmentos feitos de "LEDs")           *
 *  Cada segmento é uma fileira de círculos; aceso = vermelho glow. *
 * ================================================================ */

// Coordenadas do dígito (viewBox 60 x 104)
const D = {
  xL: 14, xR: 46,      // colunas verticais (esq/dir)
  yT: 16, yM: 52, yB: 88, // linhas horizontais (topo/meio/base)
  dots: 5,             // LEDs por segmento
  r: 3.1,              // raio do LED
};

// Endpoints de cada segmento: [x1,y1,x2,y2]
const SEG_GEOM = {
  a: [D.xL, D.yT, D.xR, D.yT], // topo
  b: [D.xR, D.yT, D.xR, D.yM], // sup-dir
  c: [D.xR, D.yM, D.xR, D.yB], // inf-dir
  d: [D.xL, D.yB, D.xR, D.yB], // base
  e: [D.xL, D.yM, D.xL, D.yB], // inf-esq
  f: [D.xL, D.yT, D.xL, D.yM], // sup-esq
  g: [D.xL, D.yM, D.xR, D.yM], // meio
};

// Quais segmentos acendem para cada dígito 0–9
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

const SVGNS = 'http://www.w3.org/2000/svg';

function lineDots(x1, y1, x2, y2, n) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    pts.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]);
  }
  return pts;
}

// Cria um elemento <svg> de um dígito, com todos os LEDs desenhados.
function createDigit() {
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('viewBox', '0 0 60 104');
  svg.setAttribute('class', 'digit');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  for (const seg of Object.keys(SEG_GEOM)) {
    const [x1, y1, x2, y2] = SEG_GEOM[seg];
    const g = document.createElementNS(SVGNS, 'g');
    g.setAttribute('data-seg', seg);
    for (const [cx, cy] of lineDots(x1, y1, x2, y2, D.dots)) {
      const c = document.createElementNS(SVGNS, 'circle');
      c.setAttribute('cx', cx.toFixed(2));
      c.setAttribute('cy', cy.toFixed(2));
      c.setAttribute('r', D.r);
      c.setAttribute('class', 'led');
      g.appendChild(c);
    }
    svg.appendChild(g);
  }
  return svg;
}

// Acende/apaga os segmentos de um dígito para exibir `ch`.
function setDigit(svg, ch) {
  const on = new Set(SEG_MAP[ch] || []);
  svg.querySelectorAll('g[data-seg]').forEach((g) => {
    g.classList.toggle('on', on.has(g.getAttribute('data-seg')));
  });
}

const MIN_SLOTS = 1; // o "campo" de pontos apagados vem do grid de fundo do painel

// Renderiza um número inteiro em `container` como painel de dígitos.
// Reaproveita os <svg> existentes; só cria/remove quando muda a qtd.
function renderNumber(container, value) {
  let str = String(Math.max(0, Math.floor(value)));
  while (str.length < MIN_SLOTS) str = ' ' + str; // padding esquerdo = fantasma
  const chars = str.split('');

  // Ajusta a quantidade de dígitos no DOM
  while (container.children.length < chars.length) {
    container.appendChild(createDigit());
  }
  while (container.children.length > chars.length) {
    container.removeChild(container.lastChild);
  }

  chars.forEach((ch, i) => setDigit(container.children[i], ch));
}

window.LED = { createDigit, setDigit, renderNumber };
