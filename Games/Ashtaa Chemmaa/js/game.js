/**
 * Ashtaa Chemmaa - Core Game State Machine & Controller
 */

class GameEngine {
  constructor(options = {}) {
    this.rules = new GameRules(options.rules || {});
    const dummySound = {
      playRoll() {},
      playMove() {},
      playCapture() {},
      playAshta() {},
      playChamma() {},
      playExtraTurn() {},
      playWin() {},
      playClick() {},
      speak() {}
    };
    this.sound = options.sound || (typeof AudioService !== 'undefined' ? AudioService : dummySound);
    this.bot = new SmartBot(options.botDifficulty || 'medium');

    // Default turn order: Red(0) -> Green(3) -> Blue(1) -> Yellow(2) matching Unity codebase
    this.turnOrder = [0, 3, 1, 2];
    this.turnIndex = 0;

    // Players configuration
    this.playerConfigs = [
      { id: 0, name: 'Red Player', isBot: false, botDifficulty: 'medium' },
      { id: 1, name: 'Blue Player', isBot: true, botDifficulty: 'medium' },
      { id: 2, name: 'Yellow Player', isBot: true, botDifficulty: 'medium' },
      { id: 3, name: 'Green Player', isBot: true, botDifficulty: 'medium' }
    ];

    this.pieces = [];
    this.phase = 'WAIT_ROLL'; // 'WAIT_ROLL' | 'ROLLING' | 'WAIT_MOVE' | 'MOVING' | 'GAME_OVER'
    this.lastRoll = null;
    this.hasPendingExtraTurn = false;
    this.playerCaptureCounts = [0, 0, 0, 0];
    this.winners = []; // Array of finished player IDs in order: [1st, 2nd, ...]
    this.turnCount = 0;
    this.history = []; // State stack for Undo
    this.log = []; // Textual action log
    this.gameSpeed = 1; // 1, 2, 4, 10
    this.autoRoll = false;

    // Callbacks
    this.onStateChange = null;
    this.onRollResult = null;
    this.onPieceMoved = null;
    this.onPieceCaptured = null;
    this.onTurnChanged = null;
    this.onGameOver = null;
    this.onMessage = null;

    this.initPieces();
  }

  initPieces() {
    this.pieces = [];
    for (let p = 0; p < 4; p++) {
      for (let i = 0; i < 4; i++) {
        this.pieces.push({
          id: `p${p}_${i}`,
          playerIndex: p,
          pieceIndex: i,
          currentProgress: -1, // -1 means in reserve/home pouch
          r: -1,
          c: -1,
          isFinished: false
        });
      }
    }
  }

  startNewGame(config = {}) {
    if (this.botTimeout) clearTimeout(this.botTimeout);
    if (config.playerConfigs) {
      this.playerConfigs = config.playerConfigs;
    }
    if (config.rules) {
      this.rules = new GameRules(config.rules);
    }
    if (config.turnOrder) {
      this.turnOrder = config.turnOrder;
    }
    if (config.botDifficulty) {
      this.bot.difficulty = config.botDifficulty;
    }

    this.initPieces();
    this.turnIndex = 0;
    this.turnCount = 1;
    this.lastRoll = null;
    this.hasPendingExtraTurn = false;
    this.playerCaptureCounts = [0, 0, 0, 0];
    this.winners = [];
    this.history = [];
    this.log = [];
    this.phase = 'WAIT_ROLL';

    this.notifyMessage(`${this.getCurrentPlayer().name}'s turn to roll!`);
    this.notifyState();

    // If starting player is a bot, schedule bot action
    if (this.isCurrentPlayerBot()) {
      this.scheduleBotAction();
    }
  }

  getCurrentPlayerIndex() {
    return this.turnOrder[this.turnIndex];
  }

  getCurrentPlayer() {
    const idx = this.getCurrentPlayerIndex();
    return this.playerConfigs[idx];
  }

  isCurrentPlayerBot() {
    return this.getCurrentPlayer().isBot;
  }

  canRoll() {
    return this.phase === 'WAIT_ROLL';
  }

  canSelectPiece(piece) {
    if (this.phase !== 'WAIT_MOVE' || !this.lastRoll || !piece) return false;
    if (piece.playerIndex !== this.getCurrentPlayerIndex()) return false;
    const hasCaptured = this.playerCaptureCounts[piece.playerIndex] > 0;
    return this.rules.canPieceMove(piece, this.pieces, this.getCurrentPlayerIndex(), this.lastRoll.movement, hasCaptured);
  }

  getLegalPieces() {
    if (!this.lastRoll) return [];
    const pIdx = this.getCurrentPlayerIndex();
    const hasCaptured = this.playerCaptureCounts[pIdx] > 0;
    return this.rules.getLegalPieces(this.pieces, pIdx, this.lastRoll.movement, hasCaptured);
  }

  /**
   * Action: Roll Cowrie Shells
   */
  async roll() {
    if (!this.canRoll()) return;

    this.phase = 'ROLLING';
    this.notifyState();
    this.sound.playRoll();

    const rollResult = this.rules.rollCowries();
    this.lastRoll = rollResult;

    // Trigger visual roll animation callback
    if (this.onRollResult) {
      await this.onRollResult(rollResult);
    } else {
      // Default brief delay if no animation hook
      await this.sleep(400 / this.gameSpeed);
    }

    // Sound effect for Ashta / Chamma / Regular
    if (rollResult.openCount === 0) {
      this.sound.playAshta();
      this.sound.speak("Ashta! Eight!");
    } else if (rollResult.openCount === 4) {
      this.sound.playChamma();
      this.sound.speak("Chamma! Four!");
    } else {
      this.sound.playClick();
    }

    const curPlayer = this.getCurrentPlayer();
    this.addLog(`${curPlayer.name} rolled ${rollResult.name} (${rollResult.movement} moves)${rollResult.extraTurn ? ' - Extra Turn!' : ''}`);

    const legalPieces = this.getLegalPieces();

    if (legalPieces.length === 0) {
      // No legal moves available!
      this.phase = 'MOVING';
      this.notifyMessage(`No legal move for ${curPlayer.name}.`);
      this.notifyState();

      await this.sleep(800 / this.gameSpeed);

      if (rollResult.extraTurn) {
        this.sound.playExtraTurn();
        this.notifyMessage(`${curPlayer.name} rolled ${rollResult.name} and earns an extra roll!`);
        this.phase = 'WAIT_ROLL';
        this.notifyState();
        if (this.isCurrentPlayerBot()) {
          this.scheduleBotAction();
        }
      } else {
        this.nextTurn();
      }
      return;
    }

    // Has legal moves
    this.phase = 'WAIT_MOVE';
    this.notifyMessage(`${curPlayer.name}: Choose a piece to move (${rollResult.movement} steps).`);
    this.notifyState();

    if (this.isCurrentPlayerBot()) {
      this.scheduleBotAction();
    }
  }

  /**
   * Action: Select & Move a piece
   */
  async selectPiece(pieceId) {
    if (this.phase !== 'WAIT_MOVE' || !this.lastRoll) return;

    const piece = this.pieces.find(p => p.id === pieceId);
    if (!piece || !this.canSelectPiece(piece)) return;

    // Save history snapshot for Undo (before human move)
    if (!this.isCurrentPlayerBot()) {
      this.saveHistorySnapshot();
    }

    await this.executePieceMove(piece);
  }

  async executePieceMove(piece) {
    if (!this.lastRoll || !piece) {
      this.phase = 'WAIT_MOVE';
      return;
    }

    this.phase = 'MOVING';
    this.notifyState();

    const curPlayer = this.getCurrentPlayer();
    const movement = this.lastRoll.movement;
    const extraTurn = this.lastRoll.extraTurn;

    const preview = this.rules.getMovePreview(piece, this.pieces, movement);
    if (!preview) {
      this.phase = 'WAIT_MOVE';
      return;
    }

    const wasInReserve = piece.currentProgress < 0;
    const wasOuter = piece.currentProgress >= 0 && piece.currentProgress < 16;

    // Perform step-by-step hopping animation
    const targetProgress = preview.targetProgress;
    const pathCoords = preview.pathCoordinates;

    if (this.onPieceMoved) {
      await this.onPieceMoved(piece, pathCoords, targetProgress);
    } else {
      for (const coord of pathCoords) {
        piece.r = coord.r;
        piece.c = coord.c;
        this.sound.playMove();
        await this.sleep(70 / this.gameSpeed);
      }
    }

    // Finalize piece coordinates
    piece.currentProgress = targetProgress;
    piece.r = preview.targetCell.r;
    piece.c = preview.targetCell.c;
    if (piece.currentProgress === BoardGeometry.FINISH_PROGRESS) {
      piece.isFinished = true;
    }

    // Informative move logs
    if (wasInReserve) {
      this.addLog(`🚀 ${curPlayer.name} entered a piece to start square (${piece.r},${piece.c})`);
    } else if (targetProgress === BoardGeometry.FINISH_PROGRESS) {
      this.addLog(`👑 ${curPlayer.name} reached the CENTER GOAL!`);
    } else if (wasOuter && targetProgress >= 16) {
      this.addLog(`🌀 ${curPlayer.name} entered the INNER LOOP (${piece.r},${piece.c})!`);
    } else {
      this.addLog(`${curPlayer.name} moved to (${piece.r},${piece.c})`);
    }

    let captured = false;
    // Check capture
    if (preview.capturedPiece) {
      captured = true;
      const victim = preview.capturedPiece;
      this.playerCaptureCounts[piece.playerIndex]++;
      this.sound.playCapture();

      this.addLog(`${curPlayer.name} captured ${BoardGeometry.PLAYERS[victim.playerIndex].name}'s piece!`);
      this.notifyMessage(`⚡ ${curPlayer.name} captured an opponent piece!`);

      if (this.onPieceCaptured) {
        await this.onPieceCaptured(victim);
      }

      // Return victim to home base
      victim.currentProgress = -1;
      victim.r = -1;
      victim.c = -1;
      victim.isFinished = false;
    }

    // Check if player won
    if (this.rules.hasPlayerWon(piece.playerIndex, this.pieces)) {
      if (!this.winners.includes(piece.playerIndex)) {
        this.winners.push(piece.playerIndex);
      }

      this.sound.playWin();
      this.addLog(`🏆 ${curPlayer.name} has finished all 4 pieces and WON!`);
      this.notifyMessage(`🎉 ${curPlayer.name} has reached the center goal with all pieces!`);

      this.phase = 'GAME_OVER';
      this.notifyState();
      if (this.onGameOver) {
        this.onGameOver({
          winner: curPlayer,
          winners: this.winners,
          turnCount: this.turnCount
        });
      }
      return;
    }

    // Check extra turn: from rolling 4/8 or capture (if rule enabled)
    const getsExtraTurn = extraTurn || (captured && this.rules.captureGivesExtraTurn);

    if (getsExtraTurn) {
      this.sound.playExtraTurn();
      this.notifyMessage(`🌟 ${curPlayer.name} gets an extra throw!`);
      this.phase = 'WAIT_ROLL';
      this.lastRoll = null;
      this.notifyState();

      if (this.isCurrentPlayerBot()) {
        this.scheduleBotAction();
      }
    } else {
      this.nextTurn();
    }
  }

  nextTurn() {
    this.lastRoll = null;
    this.phase = 'WAIT_ROLL';
    this.turnCount++;

    // Advance to next active player (skipping completed winners)
    let nextIndex = this.turnIndex;
    let attempts = 0;
    do {
      nextIndex = (nextIndex + 1) % this.turnOrder.length;
      attempts++;
    } while (this.winners.includes(this.turnOrder[nextIndex]) && attempts < 4);

    this.turnIndex = nextIndex;

    const nextPlayer = this.getCurrentPlayer();
    this.notifyMessage(`${nextPlayer.name}'s turn to roll.`);
    this.notifyState();

    if (this.onTurnChanged) {
      this.onTurnChanged(nextPlayer);
    }

    if (this.isCurrentPlayerBot()) {
      this.scheduleBotAction();
    }
  }

  scheduleBotAction() {
    if (this.botTimeout) clearTimeout(this.botTimeout);
    const delay = Math.max(250, 600 / this.gameSpeed);
    this.botTimeout = setTimeout(async () => {
      if (this.phase === 'GAME_OVER') return;

      if (this.phase === 'WAIT_ROLL') {
        await this.roll();
      } else if (this.phase === 'WAIT_MOVE') {
        const legal = this.getLegalPieces();
        if (legal.length > 0 && this.lastRoll) {
          const hasCaptured = this.playerCaptureCounts[this.getCurrentPlayerIndex()] > 0;
          const chosenPiece = this.bot.chooseMove(
            legal,
            this.pieces,
            this.getCurrentPlayerIndex(),
            this.lastRoll.movement,
            this.rules,
            hasCaptured
          );
          if (chosenPiece) {
            await this.sleep(400 / this.gameSpeed);
            await this.executePieceMove(chosenPiece);
          }
        }
      }
    }, delay);
  }

  saveHistorySnapshot() {
    if (this.history.length > 20) this.history.shift();
    const snapshot = {
      turnIndex: this.turnIndex,
      turnCount: this.turnCount,
      phase: this.phase,
      lastRoll: this.lastRoll ? { ...this.lastRoll } : null,
      playerCaptureCounts: [...this.playerCaptureCounts],
      winners: [...this.winners],
      pieces: this.pieces.map(p => ({ ...p }))
    };
    this.history.push(snapshot);
  }

  canUndo() {
    return this.history.length > 0 && this.phase !== 'MOVING' && this.phase !== 'ROLLING';
  }

  undo() {
    if (!this.canUndo()) return false;
    const snapshot = this.history.pop();
    this.turnIndex = snapshot.turnIndex;
    this.turnCount = snapshot.turnCount;
    this.phase = snapshot.phase;
    this.lastRoll = snapshot.lastRoll;
    this.playerCaptureCounts = [...snapshot.playerCaptureCounts];
    this.winners = [...snapshot.winners];
    this.pieces = snapshot.pieces.map(p => ({ ...p }));

    this.notifyMessage(`Undid move. ${this.getCurrentPlayer().name}'s turn.`);
    this.notifyState();
    return true;
  }

  setGameSpeed(multiplier) {
    this.gameSpeed = multiplier;
  }

  addLog(entry) {
    this.log.unshift({
      text: entry,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });
    if (this.log.length > 50) this.log.pop();
  }

  notifyMessage(msg) {
    if (this.onMessage) this.onMessage(msg);
  }

  notifyState() {
    if (this.onStateChange) {
      this.onStateChange({
        currentPlayer: this.getCurrentPlayer(),
        turnIndex: this.turnIndex,
        turnCount: this.turnCount,
        phase: this.phase,
        lastRoll: this.lastRoll,
        pieces: this.pieces,
        winners: this.winners,
        log: this.log
      });
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameEngine;
}
