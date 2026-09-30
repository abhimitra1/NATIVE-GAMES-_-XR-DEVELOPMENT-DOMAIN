/**
 * Ashtaa Chemmaa - Rich Interactive UI Controller
 */

class GameUI {
  constructor(engine) {
    this.engine = engine;
    this.boardEl = document.getElementById('game-board');
    this.boardContainer = document.getElementById('board-container');
    this.turnBannerEl = document.getElementById('turn-banner');
    this.turnPlayerNameEl = document.getElementById('turn-player-name');
    this.turnPromptEl = document.getElementById('turn-prompt');
    this.rollBtn = document.getElementById('roll-btn');
    this.rollResultBadge = document.getElementById('roll-result-badge');
    this.rollResultText = document.getElementById('roll-result-text');
    this.cowrieBowl = document.getElementById('cowrie-bowl');
    this.cowrieElements = document.querySelectorAll('.cowrie-shell');
    this.historyListEl = document.getElementById('history-list');
    this.pathOverlaySvg = document.getElementById('path-overlay-svg');

    this.selectedPiece = null;
    this.isShowingPath = false;
    this.activePathPlayer = 0;
    this.boardTheme = 'heritage'; // 'heritage' | 'original' | 'festive'

    this.setupHooks();
    this.bindEvents();
    this.renderBoard();
    this.renderPlayerBases();
  }

  setupHooks() {
    this.engine.onStateChange = (state) => this.handleStateChange(state);
    this.engine.onRollResult = (res) => this.animateCowrieRoll(res);
    this.engine.onPieceMoved = (piece, path, targetProgress) => this.animatePieceMove(piece, path, targetProgress);
    this.engine.onPieceCaptured = (victim) => this.animateCapture(victim);
    this.engine.onMessage = (msg) => this.showMessage(msg);
    this.engine.onGameOver = (data) => this.showGameOverModal(data);
  }

  bindEvents() {
    const handleActionClick = () => {
      if (this.engine.isCurrentPlayerBot()) return;
      if (this.engine.canRoll()) {
        this.engine.roll();
      } else if (this.engine.phase === 'WAIT_MOVE') {
        const legal = this.engine.getLegalPieces();
        if (legal.length === 1) {
          this.engine.selectPiece(legal[0].id);
        } else if (legal.length > 1) {
          this.showMessage('Please click one of your highlighted pieces or squares!');
        }
      }
    };

    // Roll Button
    if (this.rollBtn) {
      this.rollBtn.addEventListener('click', handleActionClick);
    }

    // Click on Cowrie Bowl to roll
    if (this.cowrieBowl) {
      this.cowrieBowl.addEventListener('click', handleActionClick);
    }

    // Spacebar to roll/move shortcut
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !e.target.matches('input, textarea, button, select')) {
        e.preventDefault();
        handleActionClick();
      }
    });

    // Speed Controls
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const speed = parseFloat(btn.dataset.speed || '1');
        this.engine.setGameSpeed(speed);
      });
    });

    // Undo button
    const undoBtn = document.getElementById('undo-btn');
    if (undoBtn) {
      undoBtn.addEventListener('click', () => {
        if (this.engine.canUndo()) {
          this.engine.undo();
        }
      });
    }

    // Show Path toggle
    const togglePathBtn = document.getElementById('toggle-path-btn');
    if (togglePathBtn) {
      togglePathBtn.addEventListener('click', () => {
        this.isShowingPath = !this.isShowingPath;
        togglePathBtn.classList.toggle('active', this.isShowingPath);
        this.updatePathOverlay();
      });
    }

    // Audio & Music Toggles
    const soundToggleBtn = document.getElementById('sound-toggle-btn');
    if (soundToggleBtn) {
      soundToggleBtn.addEventListener('click', () => {
        const isMuted = AudioService.toggleMute();
        soundToggleBtn.classList.toggle('muted', isMuted);
        soundToggleBtn.querySelector('.icon').textContent = isMuted ? '🔇' : '🔊';
      });
    }

    const musicToggleBtn = document.getElementById('music-toggle-btn');
    if (musicToggleBtn) {
      musicToggleBtn.addEventListener('click', () => {
        const isMusicOn = AudioService.toggleMusic();
        musicToggleBtn.classList.toggle('active', isMusicOn);
      });
    }

    // Board theme selector
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
      themeSelect.addEventListener('change', (e) => {
        this.setBoardTheme(e.target.value);
      });
    }

    // Responsive resize handler
    window.addEventListener('resize', () => {
      this.updatePathOverlay();
    });
  }

  setBoardTheme(theme) {
    this.boardTheme = theme;
    if (this.boardContainer) {
      this.boardContainer.dataset.theme = theme;
    }
  }

  /**
   * Render the 5x5 Board Grid
   */
  renderBoard() {
    if (!this.boardEl) return;
    this.boardEl.innerHTML = '';

    for (let r = 1; r <= 5; r++) {
      for (let c = 1; c <= 5; c++) {
        const cell = document.createElement('div');
        cell.className = 'board-cell';
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.id = `cell-${r}-${c}`;

        const isSafe = BoardGeometry.isSafeCell(r, c);
        const isGoal = BoardGeometry.isCenterGoal(r, c);

        if (isGoal) {
          cell.classList.add('cell-goal');
          cell.innerHTML = `
            <div class="cell-mandala"></div>
            <div class="cell-goal-emblem">🎯</div>
            <div class="cell-label">GOAL</div>
            <div class="cell-pieces-holder" id="pieces-${r}-${c}"></div>
          `;
        } else if (isSafe) {
          cell.classList.add('cell-safe');
          const safeInfo = BoardGeometry.getSafeCellInfo(r, c);
          let safeColor = 'gold';
          if (r === 3 && c === 1) safeColor = 'red';
          if (r === 3 && c === 5) safeColor = 'blue';
          if (r === 1 && c === 3) safeColor = 'yellow';
          if (r === 5 && c === 3) safeColor = 'green';

          cell.classList.add(`safe-${safeColor}`);
          cell.innerHTML = `
            <div class="cell-cross"></div>
            <div class="cell-cross-diagonal"></div>
            <div class="cell-safe-badge" title="${safeInfo.label}">🛡️</div>
            <div class="cell-pieces-holder" id="pieces-${r}-${c}"></div>
          `;
        } else {
          // Regular cell
          const isInner = (r >= 2 && r <= 4 && c >= 2 && c <= 4);
          if (isInner) cell.classList.add('cell-inner');
          cell.innerHTML = `
            <div class="cell-number">${r},${c}</div>
            <div class="cell-pieces-holder" id="pieces-${r}-${c}"></div>
          `;
        }

        cell.addEventListener('click', () => {
          this.handleCellClick(r, c);
        });

        this.boardEl.appendChild(cell);
      }
    }
  }

  handleCellClick(r, c) {
    if (this.engine.phase !== 'WAIT_MOVE' || !this.engine.lastRoll || this.engine.isCurrentPlayerBot()) return;
    const legalPieces = this.engine.getLegalPieces();
    for (const piece of legalPieces) {
      const preview = this.engine.rules.getMovePreview(piece, this.engine.pieces, this.engine.lastRoll.movement);
      if (preview && preview.targetCell.r === r && preview.targetCell.c === c) {
        this.engine.selectPiece(piece.id);
        return;
      }
    }
  }

  /**
   * Render Player Bases (Podiums / Pouch / Reserve)
   */
  renderPlayerBases() {
    for (let p = 0; p < 4; p++) {
      const baseEl = document.getElementById(`player-base-${p}`);
      if (!baseEl) continue;

      const playerInfo = BoardGeometry.PLAYERS[p];
      const config = this.engine.playerConfigs[p];

      baseEl.innerHTML = `
        <div class="base-header">
          <div class="player-avatar" style="border-color: ${playerInfo.color}">
            ${playerInfo.avatar}
          </div>
          <div class="player-info">
            <div class="player-name" style="color: ${playerInfo.accentColor}">${config.name}</div>
            <div class="player-type-badge">${config.isBot ? `🤖 Bot (${config.botDifficulty})` : '👤 Human'}</div>
          </div>
        </div>
        <div class="base-reserve">
          <div class="reserve-title">RESERVE (HOME)</div>
          <div class="reserve-slots" id="reserve-slots-${p}"></div>
        </div>
        <div class="base-stats">
          <span class="stat-badge" id="stat-finished-${p}">🏁 0/4</span>
          <span class="stat-badge" id="stat-captures-${p}">⚔️ 0</span>
        </div>
      `;
    }
    this.syncPieces(this.engine.pieces);
  }

  /**
   * Full Piece and State Synchronization
   */
  handleStateChange(state) {
    const curPlayer = state.currentPlayer;
    const curPlayerInfo = BoardGeometry.PLAYERS[curPlayer.id];

    // Update Turn Banner
    if (this.turnBannerEl) {
      this.turnBannerEl.style.borderColor = curPlayerInfo.color;
      this.turnBannerEl.style.boxShadow = `0 0 25px ${curPlayerInfo.glowColor}`;
    }
    if (this.turnPlayerNameEl) {
      this.turnPlayerNameEl.textContent = curPlayer.name;
      this.turnPlayerNameEl.style.color = curPlayerInfo.accentColor;
    }

    // Turn indicator highlights on player bases
    document.querySelectorAll('.player-base').forEach(b => b.classList.remove('active-turn'));
    const activeBase = document.getElementById(`player-base-${curPlayer.id}`);
    if (activeBase) activeBase.classList.add('active-turn');

    // Update Roll Button
    if (this.rollBtn) {
      const isHumanWaitRoll = state.phase === 'WAIT_ROLL' && !curPlayer.isBot;
      const isHumanWaitMove = state.phase === 'WAIT_MOVE' && !curPlayer.isBot;
      const legal = this.engine.getLegalPieces();

      if (isHumanWaitRoll) {
        this.rollBtn.disabled = false;
        this.rollBtn.classList.add('pulse-glow');
        this.rollBtn.innerHTML = `<span>ROLL COWRIES</span> <kbd>Space</kbd>`;
      } else if (isHumanWaitMove) {
        this.rollBtn.disabled = false;
        this.rollBtn.classList.add('pulse-glow');
        if (legal.length === 1) {
          const action = legal[0].currentProgress < 0 ? 'ENTER PIECE' : 'MOVE PIECE';
          this.rollBtn.innerHTML = `<span>${action}</span> <kbd>Space</kbd>`;
        } else {
          this.rollBtn.innerHTML = `<span>CHOOSE PIECE</span>`;
        }
      } else if (state.phase === 'ROLLING') {
        this.rollBtn.disabled = true;
        this.rollBtn.classList.remove('pulse-glow');
        this.rollBtn.innerHTML = `<span>ROLLING...</span>`;
      } else if (curPlayer.isBot) {
        this.rollBtn.disabled = true;
        this.rollBtn.classList.remove('pulse-glow');
        this.rollBtn.innerHTML = `<span>BOT THINKING...</span>`;
      } else {
        this.rollBtn.disabled = true;
        this.rollBtn.classList.remove('pulse-glow');
        this.rollBtn.innerHTML = `<span>WAITING...</span>`;
      }
    }

    // Update Result Badge
    if (this.rollResultBadge && state.lastRoll) {
      this.rollResultBadge.classList.remove('hidden', 'ashta-badge', 'chamma-badge');
      if (state.lastRoll.openCount === 0) {
        this.rollResultBadge.classList.add('ashta-badge');
        this.rollResultText.textContent = `ASHTA! (8) 🌟 Extra Turn`;
      } else if (state.lastRoll.openCount === 4) {
        this.rollResultBadge.classList.add('chamma-badge');
        this.rollResultText.textContent = `CHAMMA! (4) 🌟 Extra Turn`;
      } else {
        this.rollResultText.textContent = `MOVE: ${state.lastRoll.movement}`;
      }
    } else if (this.rollResultBadge && !state.lastRoll) {
      this.rollResultBadge.classList.add('hidden');
    }

    // Update Undo button state
    const undoBtn = document.getElementById('undo-btn');
    if (undoBtn) {
      undoBtn.disabled = !this.engine.canUndo();
    }

    // Update Player stats
    for (let p = 0; p < 4; p++) {
      const finishedCount = state.pieces.filter(pc => pc.playerIndex === p && pc.currentProgress === BoardGeometry.FINISH_PROGRESS).length;
      const captureCount = this.engine.playerCaptureCounts[p] || 0;
      const statFin = document.getElementById(`stat-finished-${p}`);
      const statCap = document.getElementById(`stat-captures-${p}`);
      if (statFin) statFin.textContent = `🏁 ${finishedCount}/4`;
      if (statCap) statCap.textContent = `⚔️ ${captureCount}`;
    }

    // Render pieces in cells and reserves
    this.syncPieces(state.pieces);

    // Update history log
    this.updateLog(state.log);

    // Update path overlay if active
    if (this.isShowingPath) {
      this.activePathPlayer = curPlayer.id;
      this.updatePathOverlay();
    }
  }

  /**
   * Sync Pieces onto DOM
   */
  syncPieces(pieces) {
    // Clear all piece holders
    document.querySelectorAll('.cell-pieces-holder').forEach(el => el.innerHTML = '');
    for (let p = 0; p < 4; p++) {
      const slot = document.getElementById(`reserve-slots-${p}`);
      if (slot) slot.innerHTML = '';
    }

    // Clear board highlights
    document.querySelectorAll('.board-cell').forEach(c => {
      c.classList.remove('highlight-target', 'highlight-capture', 'highlight-safe');
    });

    const legalPieces = this.engine.getLegalPieces();
    const legalIds = new Set(legalPieces.map(lp => lp.id));

    pieces.forEach(piece => {
      const pieceEl = this.createPieceElement(piece, legalIds.has(piece.id));

      if (piece.currentProgress < 0) {
        // Place in player's reserve slot
        const reserveContainer = document.getElementById(`reserve-slots-${piece.playerIndex}`);
        if (reserveContainer) {
          reserveContainer.appendChild(pieceEl);
        }
      } else {
        // Place on board cell (r, c)
        const cellHolder = document.getElementById(`pieces-${piece.r}-${piece.c}`);
        if (cellHolder) {
          cellHolder.appendChild(pieceEl);
        }
      }
    });
  }

  createPieceElement(piece, isLegal) {
    const el = document.createElement('div');
    el.className = `player-piece piece-player-${piece.playerIndex}`;
    el.id = `piece-el-${piece.id}`;
    el.dataset.pieceId = piece.id;
    el.dataset.player = piece.playerIndex;

    const playerInfo = BoardGeometry.PLAYERS[piece.playerIndex];
    el.style.setProperty('--piece-color', playerInfo.color);
    el.style.setProperty('--piece-accent', playerInfo.accentColor);
    el.style.setProperty('--piece-glow', playerInfo.glowColor);

    if (piece.currentProgress >= BoardGeometry.FINISH_PROGRESS) {
      el.classList.add('piece-finished');
      el.innerHTML = `<span class="piece-symbol">👑</span>`;
      return el;
    }

    el.innerHTML = `
      <div class="piece-inner">
        <span class="piece-symbol">${playerInfo.avatar}</span>
      </div>
    `;

    if (isLegal) {
      el.classList.add('piece-legal');
      el.setAttribute('tabindex', '0');

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.engine.canSelectPiece(piece) && !this.engine.isCurrentPlayerBot()) {
          this.engine.selectPiece(piece.id);
        }
      });

      // Hover preview
      el.addEventListener('mouseenter', () => this.showMovePreview(piece));
      el.addEventListener('mouseleave', () => this.clearMovePreview());
    }

    return el;
  }

  showMovePreview(piece) {
    if (!this.engine.lastRoll) return;
    const preview = this.engine.rules.getMovePreview(piece, this.engine.pieces, this.engine.lastRoll.movement);
    if (!preview) return;

    const targetCellEl = document.getElementById(`cell-${preview.targetCell.r}-${preview.targetCell.c}`);
    if (targetCellEl) {
      targetCellEl.classList.add('highlight-target');
      if (preview.capturedPiece) {
        targetCellEl.classList.add('highlight-capture');
      } else if (preview.isSafe) {
        targetCellEl.classList.add('highlight-safe');
      }
    }

    // Draw preview trail on SVG
    this.drawPathTrail(preview.pathCoordinates, BoardGeometry.PLAYERS[piece.playerIndex].accentColor);
  }

  clearMovePreview() {
    document.querySelectorAll('.board-cell').forEach(c => {
      c.classList.remove('highlight-target', 'highlight-capture', 'highlight-safe');
    });
    if (!this.isShowingPath) {
      this.clearPathOverlay();
    }
  }

  /**
   * 3D Cowrie Shell Rolling Animation
   */
  async animateCowrieRoll(rollResult) {
    if (!this.cowrieBowl) return;

    this.cowrieBowl.classList.add('rolling');

    // Randomize initial dynamic tumble
    this.cowrieElements.forEach(shell => {
      shell.classList.remove('open', 'closed', 'landing');
      shell.classList.add('tumbling');
    });

    const duration = 500 / this.engine.gameSpeed;
    await this.engine.sleep(duration);

    this.cowrieBowl.classList.remove('rolling');

    // Land shells
    this.cowrieElements.forEach((shell, idx) => {
      shell.classList.remove('tumbling');
      const isOpen = rollResult.shells[idx];
      if (isOpen) {
        shell.classList.add('open');
      } else {
        shell.classList.add('closed');
      }
      shell.classList.add('landing');
    });

    await this.engine.sleep(200 / this.engine.gameSpeed);
  }

  /**
   * Step-by-step Piece Hopping Animation
   */
  async animatePieceMove(piece, pathCoords, targetProgress) {
    const pieceEl = document.getElementById(`piece-el-${piece.id}`);
    if (!pieceEl) return;

    pieceEl.classList.add('hopping');

    const stepDelay = Math.max(50, 180 / this.engine.gameSpeed);

    for (let i = 0; i < pathCoords.length; i++) {
      const coord = pathCoords[i];
      const targetHolder = document.getElementById(`pieces-${coord.r}-${coord.c}`);
      if (targetHolder) {
        targetHolder.appendChild(pieceEl);
        AudioService.playMove();
      }
      await this.engine.sleep(stepDelay);
    }

    pieceEl.classList.remove('hopping');
  }

  /**
   * Capture shockwave animation
   */
  async animateCapture(victim) {
    const victimEl = document.getElementById(`piece-el-${victim.id}`);
    if (!victimEl) return;

    victimEl.classList.add('capture-blast');
    await this.engine.sleep(300 / this.engine.gameSpeed);
    victimEl.classList.remove('capture-blast');
  }

  showMessage(msg) {
    if (this.turnPromptEl) {
      this.turnPromptEl.textContent = msg;
    }
  }

  updateLog(log) {
    if (!this.historyListEl) return;
    this.historyListEl.innerHTML = log.map(item => `
      <div class="history-item">
        <span class="history-time">${item.time}</span>
        <span class="history-text">${item.text}</span>
      </div>
    `).join('');
  }

  /**
   * Draw visual path overlay on SVG
   */
  updatePathOverlay() {
    if (!this.pathOverlaySvg) return;
    if (!this.isShowingPath) {
      this.clearPathOverlay();
      return;
    }

    const curPlayer = this.engine.getCurrentPlayerIndex();
    const fullPath = BoardGeometry.PLAYER_PATHS[curPlayer];
    const playerInfo = BoardGeometry.PLAYERS[curPlayer];

    this.drawPathTrail(fullPath, playerInfo.accentColor, true);
  }

  drawPathTrail(coords, strokeColor = '#ffd166', isFullGuide = false) {
    if (!this.pathOverlaySvg || !this.boardEl) return;

    const boardRect = this.boardEl.getBoundingClientRect();
    this.pathOverlaySvg.setAttribute('viewBox', `0 0 ${boardRect.width} ${boardRect.height}`);
    this.pathOverlaySvg.innerHTML = '';

    if (!coords || coords.length < 2) return;

    const points = coords.map(c => {
      const cellEl = document.getElementById(`cell-${c.r}-${c.c}`);
      if (!cellEl) return null;
      const r = cellEl.getBoundingClientRect();
      return {
        x: r.left - boardRect.left + r.width / 2,
        y: r.top - boardRect.top + r.height / 2
      };
    }).filter(Boolean);

    if (points.length < 2) return;

    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathD += ` L ${points[i].x} ${points[i].y}`;
    }

    // Path Line
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathD);
    path.setAttribute('stroke', strokeColor);
    path.setAttribute('stroke-width', isFullGuide ? '4' : '6');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-dasharray', isFullGuide ? '6,6' : 'none');
    path.setAttribute('fill', 'none');
    path.classList.add('animated-path-trail');

    this.pathOverlaySvg.appendChild(path);

    // Directional dots
    points.forEach((pt, idx) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', pt.x);
      circle.setAttribute('cy', pt.y);
      circle.setAttribute('r', isFullGuide ? '3' : '5');
      circle.setAttribute('fill', idx === points.length - 1 ? '#00f5d4' : strokeColor);
      this.pathOverlaySvg.appendChild(circle);
    });
  }

  clearPathOverlay() {
    if (this.pathOverlaySvg) {
      this.pathOverlaySvg.innerHTML = '';
    }
  }

  /**
   * Victory Modal
   */
  showGameOverModal(data) {
    const modal = document.getElementById('victory-modal');
    if (!modal) return;

    const winnerNameEl = document.getElementById('winner-name');
    const winnerStatsEl = document.getElementById('winner-stats');

    if (winnerNameEl) {
      winnerNameEl.textContent = `${data.winner.name} WINS!`;
      winnerNameEl.style.color = BoardGeometry.PLAYERS[data.winner.id].accentColor;
    }

    if (winnerStatsEl) {
      winnerStatsEl.innerHTML = `
        <div class="stat-row"><span>Total Turns:</span> <strong>${data.turnCount}</strong></div>
        <div class="stat-row"><span>Captures Made:</span> <strong>${this.engine.playerCaptureCounts[data.winner.id]}</strong></div>
        <div class="stat-row"><span>Player Type:</span> <strong>${data.winner.isBot ? 'Bot' : 'Human'}</strong></div>
      `;
    }

    modal.classList.remove('hidden');
    this.launchConfetti();
  }

  launchConfetti() {
    const container = document.getElementById('confetti-container');
    if (!container) return;
    container.innerHTML = '';

    const colors = ['#ffd166', '#ef476f', '#06d6a0', '#118ab2', '#073b4c', '#ffbe0b'];
    for (let i = 0; i < 70; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = `${Math.random() * 2}s`;
      piece.style.animationDuration = `${2 + Math.random() * 3}s`;
      container.appendChild(piece);
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameUI;
}
