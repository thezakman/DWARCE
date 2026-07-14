'use strict';

/* ================================================================ *
 *  PONG no painel de LED (easter egg).                              *
 *  Player = raquete esquerda (mouse Y no painel / setas ↑↓).        *
 *  CPU = raquete direita. Esc sai. Primeiro a 5 vence.              *
 *  window.PONG.start(matrixEl, { input, target, onWin, onExit })    *
 * ================================================================ */

(function () {
  const COLS = 42, ROWS = 22, PAD = 5;
  const HALF = Math.floor(PAD / 2); // meia-altura REAL desenhada (células inteiras)
  let running = false, raf = null, g = null;

  // mantém a raquete inteira dentro da grade [0, ROWS-1]
  function clampPad(y) { return Math.max(HALF, Math.min(ROWS - 1 - HALF, y)); }

  function resetBall(dir) {
    g.bx = COLS / 2; g.by = ROWS / 2;
    g.vx = 0.34 * dir; g.vy = (g.rng() - 0.5) * 0.4;
  }

  function step() {
    // player
    if (g.keys.up) g.pL -= 0.4;
    if (g.keys.down) g.pL += 0.4;
    g.pL = clampPad(g.pL);
    // cpu (leve atraso pra dar chance)
    const aim = g.by + (g.rng() - 0.5) * 1.2;
    if (g.pR < aim - 0.3) g.pR += 0.24;
    else if (g.pR > aim + 0.3) g.pR -= 0.24;
    g.pR = clampPad(g.pR);
    // ball
    g.bx += g.vx; g.by += g.vy;
    if (g.by < 0.5) { g.by = 0.5; g.vy = Math.abs(g.vy); }
    if (g.by > ROWS - 1.5) { g.by = ROWS - 1.5; g.vy = -Math.abs(g.vy); }
    // raquetes
    if (g.bx <= 2.2 && g.vx < 0 && Math.abs(g.by - g.pL) <= PAD / 2 + 0.6) {
      g.vx = Math.min(0.75, Math.abs(g.vx) * 1.04); g.vy += (g.by - g.pL) * 0.07;
    }
    if (g.bx >= COLS - 3.2 && g.vx > 0 && Math.abs(g.by - g.pR) <= PAD / 2 + 0.6) {
      g.vx = -Math.min(0.75, Math.abs(g.vx) * 1.04); g.vy += (g.by - g.pR) * 0.07;
    }
    // ponto
    if (g.bx < 0) { g.cpu++; resetBall(1); }
    if (g.bx > COLS) { g.you++; resetBall(-1); }
    if (g.you >= g.target || g.cpu >= g.target) {
      const won = g.you >= g.target;
      stop();
      if (won && g.onWin) g.onWin();
    }
  }

  function draw(el) {
    const W = el.clientWidth, H = el.clientHeight;
    if (!W || !H) return;
    const px = W / COLS, py = H / ROWS;
    const pitch = Math.min(px, py);
    const rOn = (pitch * 0.36).toFixed(1), rOff = (pitch * 0.11).toFixed(1);
    const on = new Set();
    on.add(Math.round(g.bx) + ',' + Math.round(g.by));                 // bola
    for (let i = -Math.floor(PAD / 2); i <= Math.floor(PAD / 2); i++) { // raquetes
      on.add('2,' + Math.round(g.pL + i));
      on.add((COLS - 3) + ',' + Math.round(g.pR + i));
    }
    const mid = Math.floor(COLS / 2);
    let onSvg = '', offSvg = '';
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cx = ((c + 0.5) * px).toFixed(1), cy = ((r + 0.5) * py).toFixed(1);
        if (on.has(c + ',' + r)) onSvg += `<circle cx="${cx}" cy="${cy}" r="${rOn}"/>`;
        else if (c === mid && r % 2 === 0) offSvg += `<circle cx="${cx}" cy="${cy}" r="${rOff}"/>`;
      }
    }
    el.innerHTML = `<svg class="matrix-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="none">`
      + `<g class="off-layer">${offSvg}</g><g class="on-layer">${onSvg}</g></svg>`;
    const sc = document.getElementById('pongScore');
    if (sc) sc.textContent = `${g.you} : ${g.cpu}`;
  }

  function start(el, opts) {
    if (running) return;
    opts = opts || {};
    running = true;
    g = {
      bx: COLS / 2, by: ROWS / 2, vx: 0.34, vy: 0.2,
      pL: ROWS / 2, pR: ROWS / 2, you: 0, cpu: 0,
      target: opts.target || 5, keys: {},
      onWin: opts.onWin, onExit: opts.onExit,
      // sem Math.random direto: usa um LCG simples semeado por performance.now
      rng: (() => { let seed = (performance.now() | 0) || 1; return () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }; })(),
    };
    const input = opts.input || el;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      if (!r.height) return;
      g.pL = clampPad(((e.clientY - r.top) / r.height) * ROWS);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') { stop(); return; }
      if (e.key === 'ArrowUp') { g.keys.up = true; e.preventDefault(); }
      if (e.key === 'ArrowDown') { g.keys.down = true; e.preventDefault(); }
    };
    const onKeyUp = (e) => {
      if (e.key === 'ArrowUp') g.keys.up = false;
      if (e.key === 'ArrowDown') g.keys.down = false;
    };
    input.addEventListener('mousemove', onMove);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    g.cleanup = () => {
      input.removeEventListener('mousemove', onMove);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
    const loop = () => { if (!running) return; step(); if (running) draw(el); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    if (!running) return;
    running = false;
    if (raf) cancelAnimationFrame(raf);
    const cb = g && g.onExit, clean = g && g.cleanup;
    g = null;
    if (clean) clean();
    if (cb) cb();
  }

  window.PONG = { start, stop, isRunning: () => running };
})();
