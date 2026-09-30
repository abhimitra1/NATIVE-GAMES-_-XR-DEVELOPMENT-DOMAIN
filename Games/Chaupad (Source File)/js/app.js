/**
 * app.js - Main Application Orchestrator for Chaupad
 */

import { ChaupadRules } from './engine/ChaupadRules.js';
import { ChaupadAI } from './engine/ChaupadAI.js';
import { SoundFX } from './audio/SoundFX.js';
import { BoardRenderer } from './render/BoardRenderer.js';
import { Dice3DRenderer } from './render/Dice3DRenderer.js';
import { Effects } from './render/Effects.js';

export class ChaupadApp {
  constructor() {
    this.soundFx = new SoundFX();
    this.rules = null;
    this.boardRenderer = null;
    this.diceRenderer = null;
  }

  init() {
    const boardEl = document.getElementById('board');
    const tokensEl = document.getElementById('tokens');
    const sticks = [
      document.getElementById('stick0'),
      document.getElementById('stick1'),
      document.getElementById('stick2')
    ];
    const sumEl = document.getElementById('roll-sum');
    const capEl = document.getElementById('roll-cap');
    const dustEl = document.getElementById('dust');

    if (boardEl && tokensEl) {
      this.boardRenderer = new BoardRenderer(boardEl, tokensEl);
    }
    if (sticks[0] && sumEl) {
      this.diceRenderer = new Dice3DRenderer(sticks, sumEl, capEl, this.soundFx);
      this.diceRenderer.reset();
    }
    if (dustEl) {
      Effects.initDust(dustEl);
    }

    console.log('Chaupad App Initialized successfully.');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new ChaupadApp();
  app.init();
});
