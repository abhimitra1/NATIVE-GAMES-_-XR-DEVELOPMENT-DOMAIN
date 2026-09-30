/**
 * DAHDI (DHD) - APPLICATION CONTROLLER & FSM
 * Orchestrates user interactions, match state machine, AI turns, and settings.
 */

import {
  PLAYER_SIDE,
  GAME_PHASE,
  SUB_STATE,
  TOTAL_PIECES_PER_PLAYER,
  STRINGS
} from './constants.js';
import { MillState, MillRules } from './rules.js';
import { MillAI } from './ai.js';
import { AudioEngine } from './audio.js';
import { BoardRenderer, triggerWinConfetti } from './render.js';

class DahdiApp {
  constructor() {
    this.gameMode = 'vsAI'; // 'vsAI' | 'passAndPlay'
    this.aiSide = PLAYER_SIDE.SIDE_B; // Player 2 is AI
    this.aiDifficulty = 'medium'; // 'easy' | 'medium' | 'hard'
    this.useDiagonals = false; // Standard 9-men vs 12-men Traditional
    this.currentLanguage = localStorage.getItem('dhd_lang') || 'en';

    this.rules = new MillRules(this.useDiagonals);
    this.state = new MillState(this.useDiagonals);
    this.ai = new MillAI(this.rules, this.aiDifficulty);
    this.audio = new AudioEngine();

    this.history = [];
    this.selectedPoint = null;
    this.hintMove = null;
    this.isAiBusy = false;

    this.initDOM();
    this.renderer = new BoardRenderer(
      document.getElementById('board-container'),
      (ptId) => this.handlePointClick(ptId)
    );

    this.initEvents();
    this.startNewGame();
  }

  initDOM() {
    this.dom = {
      boardContainer: document.getElementById('board-container'),
      turnBanner: document.getElementById('turn-status-text'),
      turnDot: document.getElementById('turn-dot'),
      phasePill: document.getElementById('phase-pill'),
      playerCardA: document.getElementById('player-card-a'),
      playerCardB: document.getElementById('player-card-b'),
      beadsA: document.getElementById('beads-a'),
      beadsB: document.getElementById('beads-b'),
      btnUndo: document.getElementById('btn-undo'),
      btnHint: document.getElementById('btn-hint'),
      btnRestart: document.getElementById('btn-restart'),
      btnSettings: document.getElementById('btn-settings'),
      btnRules: document.getElementById('btn-rules'),
      // Modals
      settingsModal: document.getElementById('settings-modal'),
      rulesModal: document.getElementById('rules-modal'),
      resultModal: document.getElementById('result-modal'),
      // Settings controls
      cbColourBlind: document.getElementById('cb-colour-blind'),
      cbReduceMotion: document.getElementById('cb-reduce-motion'),
      cbDiagonals: document.getElementById('cb-diagonals'),
      cbTanpura: document.getElementById('cb-tanpura'),
      selectGameMode: document.getElementById('select-game-mode'),
      selectDifficulty: document.getElementById('select-difficulty'),
      selectLanguage: document.getElementById('select-language'),
      rangeSfx: document.getElementById('range-sfx'),
      // Result
      resultTitle: document.getElementById('result-title'),
      resultSubtitle: document.getElementById('result-subtitle'),
      btnRematch: document.getElementById('btn-rematch'),
    };
  }

  initEvents() {
    // Buttons
    this.dom.btnRestart.addEventListener('click', () => {
      this.audio.playTap();
      this.startNewGame();
    });

    this.dom.btnUndo.addEventListener('click', () => {
      this.audio.playTap();
      this.undoMove();
    });

    this.dom.btnHint.addEventListener('click', () => {
      this.audio.playTap();
      this.requestHint();
    });

    this.dom.btnSettings.addEventListener('click', () => {
      this.audio.playTap();
      this.openModal(this.dom.settingsModal);
    });

    this.dom.btnRules.addEventListener('click', () => {
      this.audio.playTap();
      this.openModal(this.dom.rulesModal);
    });

    this.dom.btnRematch.addEventListener('click', () => {
      this.audio.playTap();
      this.closeModal(this.dom.resultModal);
      this.startNewGame();
    });

    // Close buttons on modals
    document.querySelectorAll('.dialog-close-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.audio.playTap();
        const modal = e.target.closest('.modal-overlay');
        if (modal) this.closeModal(modal);
      });
    });

    // Settings interactions
    this.dom.selectGameMode.addEventListener('change', (e) => {
      this.gameMode = e.target.value;
      this.dom.selectDifficulty.parentElement.style.display = this.gameMode === 'vsAI' ? 'flex' : 'none';
      this.startNewGame();
    });

    this.dom.selectDifficulty.addEventListener('change', (e) => {
      this.aiDifficulty = e.target.value;
      this.ai.setDifficulty(this.aiDifficulty);
    });

    this.dom.selectLanguage.addEventListener('change', (e) => {
      this.currentLanguage = e.target.value;
      localStorage.setItem('dhd_lang', this.currentLanguage);
      this.applyLocalization();
    });

    this.dom.cbColourBlind.addEventListener('change', (e) => {
      document.body.classList.toggle('colour-blind-mode', e.target.checked);
      localStorage.setItem('dhd_cb_mode', e.target.checked);
      this.updateView();
    });

    this.dom.cbReduceMotion.addEventListener('change', (e) => {
      document.body.classList.toggle('reduce-motion', e.target.checked);
      localStorage.setItem('dhd_reduce_motion', e.target.checked);
    });

    this.dom.cbDiagonals.addEventListener('change', (e) => {
      this.useDiagonals = e.target.checked;
      this.rules.setVariant(this.useDiagonals);
      this.startNewGame();
    });

    this.dom.cbTanpura.addEventListener('change', (e) => {
      this.audio.toggleDrone(e.target.checked);
    });

    this.dom.rangeSfx.addEventListener('input', (e) => {
      this.audio.setSfxVolume(parseFloat(e.target.value));
    });

    // Keyboard Shortcuts (U, H, Esc, R) as specified in Build Spec Section 8
    window.addEventListener('keydown', (e) => {
      if (e.key === 'u' || e.key === 'U') {
        this.undoMove();
      } else if (e.key === 'h' || e.key === 'H') {
        this.requestHint();
      } else if (e.key === 'r' || e.key === 'R') {
        this.startNewGame();
      } else if (e.key === 'Escape') {
        if (this.dom.settingsModal.classList.contains('open')) {
          this.closeModal(this.dom.settingsModal);
        } else if (this.dom.rulesModal.classList.contains('open')) {
          this.closeModal(this.dom.rulesModal);
        } else {
          this.openModal(this.dom.settingsModal);
        }
      }
    });

    // First user gesture unlocks Web Audio
    window.addEventListener('pointerdown', () => {
      this.audio.ensureContext();
    }, { once: true });

    // Restore persisted settings
    if (localStorage.getItem('dhd_cb_mode') === 'true') {
      this.dom.cbColourBlind.checked = true;
      document.body.classList.add('colour-blind-mode');
    }
    if (localStorage.getItem('dhd_reduce_motion') === 'true') {
      this.dom.cbReduceMotion.checked = true;
      document.body.classList.add('reduce-motion');
    }

    this.dom.selectLanguage.value = this.currentLanguage;
    this.applyLocalization();
  }

  startNewGame() {
    this.state = new MillState(this.useDiagonals);
    this.rules = new MillRules(this.useDiagonals);
    this.ai = new MillAI(this.rules, this.aiDifficulty);
    this.history = [];
    this.selectedPoint = null;
    this.hintMove = null;
    this.isAiBusy = false;

    this.renderer.renderBoardStructure(this.useDiagonals);
    this.updateView();
  }

  saveSnapshot() {
    this.history.push({
      state: this.state.clone(),
      selectedPoint: this.selectedPoint
    });
    if (this.history.length > 30) this.history.shift();
  }

  undoMove() {
    if (this.history.length === 0 || this.isAiBusy) {
      this.audio.playIllegal();
      return;
    }

    // In vsAI mode, undo player's move and AI's response together
    if (this.gameMode === 'vsAI' && this.history.length >= 2) {
      this.history.pop(); // Remove AI move
      const prev = this.history.pop(); // Remove player move
      this.state = prev.state;
      this.selectedPoint = null;
    } else {
      const prev = this.history.pop();
      this.state = prev.state;
      this.selectedPoint = null;
    }

    this.hintMove = null;
    this.updateView();
  }

  async requestHint() {
    if (this.state.winner !== null || this.isAiBusy) return;
    this.hintMove = await this.ai.findBestMove(this.state, this.state.toMove);
    this.updateView();
  }

  async handlePointClick(pointId) {
    if (this.state.winner !== null || this.isAiBusy) return;

    // In Vs AI mode, ignore clicks during AI turn
    if (this.gameMode === 'vsAI' && this.state.toMove === this.aiSide) {
      return;
    }

    const currentSide = this.state.toMove;
    const enemySide = this.state.getOpponent(currentSide);
    const occupant = this.state.cells[pointId];

    // =========================================================================
    // SUB-STATE: REMOVING (Just formed a mill, capturing an enemy piece)
    // =========================================================================
    if (this.state.subState === SUB_STATE.REMOVING) {
      const validRemovals = this.rules.getValidRemovals(this.state, enemySide);
      if (validRemovals.includes(pointId)) {
        this.saveSnapshot();
        this.audio.playCapture();
        this.renderer.animateCapture(pointId, () => {
          this.state.cells[pointId] = PLAYER_SIDE.NONE;
          this.state.subState = SUB_STATE.NORMAL;
          this.state.toMove = enemySide;
          this.rules.evaluateTerminal(this.state);
          this.hintMove = null;
          this.updateView();
          this.checkPostTurn();
        });
      } else {
        this.audio.playIllegal();
        this.renderer.shakePoint(pointId);
      }
      return;
    }

    // =========================================================================
    // PHASE 1: PLACEMENT
    // =========================================================================
    const phase = this.state.getPhase(currentSide);
    if (phase === GAME_PHASE.PLACEMENT) {
      if (occupant === PLAYER_SIDE.NONE) {
        this.saveSnapshot();
        this.audio.playPieceDrop();
        this.state.cells[pointId] = currentSide;
        this.state.setInHand(currentSide, this.state.getInHand(currentSide) - 1);
        this.hintMove = null;

        // Check if placed piece forms a mill
        if (this.rules.formsMill(this.state, pointId, currentSide)) {
          this.audio.playMillChime();
          this.renderer.flashMill();
          const validRemovals = this.rules.getValidRemovals(this.state, enemySide);
          if (validRemovals.length > 0) {
            this.state.subState = SUB_STATE.REMOVING;
            this.updateView();
            return;
          }
        }

        this.state.toMove = enemySide;
        this.rules.evaluateTerminal(this.state);
        this.updateView();
        this.checkPostTurn();
      } else {
        this.audio.playIllegal();
        this.renderer.shakePoint(pointId);
      }
      return;
    }

    // =========================================================================
    // PHASE 2 & 3: MOVEMENT & FLYING
    // =========================================================================
    if (occupant === currentSide) {
      // Select or re-select piece
      this.audio.playPiecePickup();
      this.selectedPoint = pointId;
      this.hintMove = null;
      this.updateView();
      return;
    }

    if (this.selectedPoint !== null && occupant === PLAYER_SIDE.NONE) {
      const legalDests = this.rules.getLegalDestinations(this.state, this.selectedPoint);
      if (legalDests.includes(pointId)) {
        this.saveSnapshot();
        const from = this.selectedPoint;
        this.state.cells[from] = PLAYER_SIDE.NONE;
        this.state.cells[pointId] = currentSide;
        this.selectedPoint = null;
        this.hintMove = null;
        this.audio.playPieceDrop();

        // Check mill
        if (this.rules.formsMill(this.state, pointId, currentSide)) {
          this.audio.playMillChime();
          this.renderer.flashMill();
          const validRemovals = this.rules.getValidRemovals(this.state, enemySide);
          if (validRemovals.length > 0) {
            this.state.subState = SUB_STATE.REMOVING;
            this.updateView();
            return;
          }
        }

        this.state.toMove = enemySide;
        this.rules.evaluateTerminal(this.state);
        this.updateView();
        this.checkPostTurn();
      } else {
        this.audio.playIllegal();
        this.renderer.shakePoint(pointId);
      }
    }
  }

  checkPostTurn() {
    if (this.state.winner !== null) {
      this.handleGameOver();
      return;
    }

    if (this.gameMode === 'vsAI' && this.state.toMove === this.aiSide) {
      this.executeAiTurn();
    }
  }

  async executeAiTurn() {
    this.isAiBusy = true;
    this.updateTurnBanner();

    try {
      const move = await this.ai.findBestMove(this.state, this.aiSide);
      if (!move) {
        // No moves: immobilized
        this.state.winner = this.state.getOpponent(this.aiSide);
        this.handleGameOver();
        return;
      }

      this.saveSnapshot();

      if (move.type === 'place') {
        this.audio.playPieceDrop();
        this.state.cells[move.to] = this.aiSide;
        this.state.setInHand(this.aiSide, this.state.getInHand(this.aiSide) - 1);

        if (move.remove !== null && move.remove !== undefined) {
          this.audio.playMillChime();
          this.renderer.flashMill();
          await new Promise(r => setTimeout(r, 350));
          this.audio.playCapture();
          this.state.cells[move.remove] = PLAYER_SIDE.NONE;
        }
      } else if (move.type === 'move') {
        this.audio.playPieceDrop();
        this.state.cells[move.from] = PLAYER_SIDE.NONE;
        this.state.cells[move.to] = this.aiSide;

        if (move.remove !== null && move.remove !== undefined) {
          this.audio.playMillChime();
          this.renderer.flashMill();
          await new Promise(r => setTimeout(r, 350));
          this.audio.playCapture();
          this.state.cells[move.remove] = PLAYER_SIDE.NONE;
        }
      } else if (move.type === 'remove') {
        this.audio.playCapture();
        this.state.cells[move.point] = PLAYER_SIDE.NONE;
      }

      this.state.toMove = this.state.getOpponent(this.aiSide);
      this.rules.evaluateTerminal(this.state);
    } finally {
      this.isAiBusy = false;
      this.updateView();
      if (this.state.winner !== null) {
        this.handleGameOver();
      }
    }
  }

  handleGameOver() {
    if (this.state.winner === PLAYER_SIDE.SIDE_A) {
      this.audio.playWin();
      triggerWinConfetti();
      this.dom.resultTitle.textContent = STRINGS[this.currentLanguage].winA;
      this.dom.resultSubtitle.textContent = "Spectacular strategic alignment!";
    } else if (this.state.winner === PLAYER_SIDE.SIDE_B) {
      if (this.gameMode === 'vsAI') {
        this.audio.playLose();
      } else {
        this.audio.playWin();
        triggerWinConfetti();
      }
      this.dom.resultTitle.textContent = STRINGS[this.currentLanguage].winB;
      this.dom.resultSubtitle.textContent = "A masterclass in piece mobility and mill defense.";
    } else {
      this.dom.resultTitle.textContent = STRINGS[this.currentLanguage].winDraw;
      this.dom.resultSubtitle.textContent = "Neither player can force a victory.";
    }

    setTimeout(() => {
      this.openModal(this.dom.resultModal);
    }, 600);
  }

  updateView() {
    this.renderer.updateBoardState(this.state, this.rules, this.selectedPoint, this.hintMove);
    this.updateTrays();
    this.updateTurnBanner();
  }

  updateTrays() {
    const isSideA = this.state.toMove === PLAYER_SIDE.SIDE_A;
    this.dom.playerCardA.classList.toggle('active-turn', isSideA);
    this.dom.playerCardB.classList.toggle('active-turn', !isSideA);

    // In-hand beads for Side A
    const inHandA = this.state.inHandA;
    let beadsHtmlA = '';
    for (let i = 0; i < TOTAL_PIECES_PER_PLAYER; i++) {
      const usedClass = i >= inHandA ? 'used' : '';
      beadsHtmlA += `<div class="in-hand-bead ${usedClass}"></div>`;
    }
    this.dom.beadsA.innerHTML = beadsHtmlA;

    // In-hand beads for Side B
    const inHandB = this.state.inHandB;
    let beadsHtmlB = '';
    for (let i = 0; i < TOTAL_PIECES_PER_PLAYER; i++) {
      const usedClass = i >= inHandB ? 'used' : '';
      beadsHtmlB += `<div class="in-hand-bead ${usedClass}"></div>`;
    }
    this.dom.beadsB.innerHTML = beadsHtmlB;
  }

  updateTurnBanner() {
    const lang = STRINGS[this.currentLanguage] || STRINGS.en;
    const side = this.state.toMove;
    const isRemoving = this.state.subState === SUB_STATE.REMOVING;

    if (this.isAiBusy) {
      this.dom.turnBanner.textContent = lang.aiThinking;
      this.dom.phasePill.textContent = "AI";
      return;
    }

    if (isRemoving) {
      this.dom.turnBanner.textContent = lang.millFormed;
      this.dom.phasePill.textContent = "CAPTURE";
      return;
    }

    const phase = this.state.getPhase(side);
    if (phase === GAME_PHASE.PLACEMENT) {
      this.dom.phasePill.textContent = "PHASE 1";
      this.dom.turnBanner.textContent = `${side === PLAYER_SIDE.SIDE_A ? lang.turnA : lang.turnB} — Place Piece`;
    } else if (phase === GAME_PHASE.FLYING) {
      this.dom.phasePill.textContent = "FLYING!";
      this.dom.turnBanner.textContent = `${side === PLAYER_SIDE.SIDE_A ? lang.turnA : lang.turnB} — Fly Anywhere`;
    } else {
      this.dom.phasePill.textContent = "PHASE 2";
      this.dom.turnBanner.textContent = `${side === PLAYER_SIDE.SIDE_A ? lang.turnA : lang.turnB} — Move Piece`;
    }

    this.dom.turnDot.style.background = side === PLAYER_SIDE.SIDE_A ? 'var(--side-a-color)' : 'var(--side-b-color)';
  }

  applyLocalization() {
    const lang = STRINGS[this.currentLanguage] || STRINGS.en;
    document.title = `${lang.title} - ${lang.subtitle}`;
    this.updateTurnBanner();
  }

  openModal(modal) {
    modal.classList.add('open');
  }

  closeModal(modal) {
    modal.classList.remove('open');
  }
}

// Boot application when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.dahdiApp = new DahdiApp();
});
