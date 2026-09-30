/**
 * Dice3DRenderer.js - 3D Animated Pasha Stick Dice Visualizer
 * 
 * Renders 3 wooden stick dice with tumbling rotations and brass pips.
 */

import { PIPS } from '../engine/PashaDice.js';

export class Dice3DRenderer {
  constructor(sticks, sumEl, capEl, soundFx) {
    this.sticks = sticks;
    this.sumEl = sumEl;
    this.capEl = capEl;
    this.soundFx = soundFx;
  }

  paintStick(el, value) {
    el.innerHTML = '';
    const positions = PIPS[value] || ['c'];
    positions.forEach(pos => {
      const pip = document.createElement('span');
      pip.className = `pip ${pos}`;
      el.appendChild(pip);
    });
  }

  animateRoll(rollResult, onComplete) {
    const { v, total, grace } = rollResult;
    if (this.soundFx) this.soundFx.roll();

    this.sticks.forEach((st, i) => {
      st.classList.remove('roll');
      void st.offsetWidth; // reflow
      st.classList.add('roll');

      let cnt = 0;
      const timer = setInterval(() => {
        cnt++;
        const randVal = [1, 2, 5, 6][Math.floor(Math.random() * 4)];
        this.paintStick(st, randVal);
        if (cnt === 3 && this.soundFx) this.soundFx.clack(i * 0.05 + 0.18);
        if (cnt >= 4) clearInterval(timer);
      }, 120);

      setTimeout(() => {
        this.paintStick(st, v[i]);
      }, 740);
    });

    setTimeout(() => {
      if (this.sumEl) this.sumEl.textContent = String(total);
      if (this.capEl) {
        this.capEl.textContent = grace ? 'चौ · bonus throw' : 'total';
        this.capEl.classList.toggle('grace', grace);
      }
      if (grace && this.soundFx) this.soundFx.grace();
      else if (this.soundFx) this.soundFx.clack(0.2);

      if (onComplete) onComplete();
    }, 780);
  }

  reset() {
    if (this.sumEl) this.sumEl.textContent = '—';
    if (this.capEl) {
      this.capEl.textContent = 'tap Roll';
      this.capEl.classList.remove('grace');
    }
    this.sticks.forEach(st => this.paintStick(st, 2));
  }
}
