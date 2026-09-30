/**
 * BoardRenderer.js - DOM & Canvas Board & Token Visualizer
 * 
 * Renders:
 * - 19x19 cruciform cloth board layout with alternating ivory/wheat embroidered stitches
 * - Castle safe squares with gold zardozi star-and-cross markers
 * - Central 3x3 Charkoni with SVG sacred lotus mandala
 * - Lacquered wooden gothi pawns with player colors and status animations
 */

import { LOOP, LOOPI, PS, GATEI, SAFE, getHomeCell } from '../engine/BoardGraph.js';

export class BoardRenderer {
  constructor(boardEl, tokensEl) {
    this.boardEl = boardEl;
    this.tokensEl = tokensEl;
    this.cellsByKey = {};
  }

  buildCells() {
    const f = document.createDocumentFragment();
    const isHome = {};
    PS.forEach(s => {
      s.home.forEach(c => { isHome[`${c[0]},${c[1]}`] = s.key; });
    });
    const isGate = {};
    PS.forEach(s => { isGate[`${s.gate[0]},${s.gate[1]}`] = s.key; });
    const isFinish = {};
    PS.forEach(s => { isFinish[`${s.finish[0]},${s.finish[1]}`] = s.key; });

    for (let r = 0; r < 19; r++) {
      for (let c = 0; c < 19; c++) {
        const key = `${r},${c}`;
        const d = document.createElement('div');
        d.className = 'cell';
        d.setAttribute('data-cell', key);

        const li = LOOPI[key];
        const lane = isHome[key];
        const gi = isGate[key];
        const fi = isFinish[key];

        if (li !== undefined || lane || gi || fi) {
          d.classList.add('arm');
          if (li !== undefined && !(gi !== undefined || fi !== undefined)) {
            if (li % 2 === 0) d.classList.add('alt');
            d.setAttribute('data-loop', li);
          } else if (gi !== undefined) {
            d.classList.add('castle');
            d.setAttribute('data-loop', LOOPI[key]);
            const s = PS.find(p => p.key === gi);
            d.style.setProperty('--pl', s.colour);
            d.style.setProperty('--pl-d', s.dark);
            const z = document.createElement('span');
            z.className = 'zchip';
            z.innerHTML = '<span class="cx"></span><span class="cs"></span>';
            d.appendChild(z);
          } else if (lane !== undefined) {
            d.classList.add('lane');
            d.setAttribute('data-home', lane);
          } else if (fi !== undefined) {
            d.classList.add('lane');
            d.setAttribute('data-home', fi);
            const g = document.createElement('span');
            g.className = 'gdot';
            g.innerHTML = '<span></span>';
            d.appendChild(g);
          }
        }
        this.cellsByKey[key] = d;
        f.appendChild(d);
      }
    }
    this.boardEl.insertBefore(f, this.tokensEl);
  }

  highlightMoves(legalMoves) {
    this.boardEl.querySelectorAll('.cell.legal, .cell.preview, .cell .capflag').forEach(el => {
      el.classList.remove('legal', 'preview');
      if (el.classList.contains('capflag')) el.remove();
    });

    legalMoves.forEach(m => {
      if (m.kind === 'enter') {
        const gk = `${PS[m.p].gate[0]},${PS[m.p].gate[1]}`;
        if (this.cellsByKey[gk]) this.cellsByKey[gk].classList.add('legal');
      } else if (m.kind === 'move' || m.kind === 'turn_home' || (m.kind === 'fin' && m.from !== undefined)) {
        const sk = `${LOOP[m.from][0]},${LOOP[m.from][1]}`;
        if (this.cellsByKey[sk]) this.cellsByKey[sk].classList.add('legal');
      } else if (m.kind === 'home_advance') {
        const hc = getHomeCell(m.p, m.to);
        const k = `${hc[0]},${hc[1]}`;
        if (this.cellsByKey[k]) this.cellsByKey[k].classList.add('legal');
      } else if (m.kind === 'fin_from_home') {
        const fc = PS[m.p].finish;
        const k = `${fc[0]},${fc[1]}`;
        if (this.cellsByKey[k]) this.cellsByKey[k].classList.add('legal');
      }
    });
  }
}
