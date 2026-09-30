/**
 * DAHDI (DHD) - BOARD & PIECE RENDERER
 * Handles SVG grid rendering, point nodes, piece badging, animations, and celebratory VFX.
 */

import {
  BOARD_POINTS,
  PLAYER_SIDE,
  GAME_PHASE,
  SUB_STATE
} from './constants.js';

export class BoardRenderer {
  constructor(boardContainer, onPointClick) {
    this.container = boardContainer;
    this.onPointClick = onPointClick;
    this.coords = this.calculatePointPercentages();
  }

  calculatePointPercentages() {
    // 0..6 grid mapped into 9%..91% range
    const step = 82 / 6; // 13.6667%
    return BOARD_POINTS.map(pt => ({
      ...pt,
      pctX: 9 + pt.x * step,
      pctY: 9 + pt.y * step,
    }));
  }

  renderBoardStructure(useDiagonals = false) {
    const step = 82 / 6;
    const p = (v) => (9 + v * step).toFixed(2);

    let diagonalSvg = '';
    if (useDiagonals) {
      diagonalSvg = `
        <!-- Corner Diagonals (Anthology Traditional Variant) -->
        <line x1="${p(0)}" y1="${p(0)}" x2="${p(2)}" y2="${p(2)}" class="grid-line diagonal-line" />
        <line x1="${p(6)}" y1="${p(0)}" x2="${p(4)}" y2="${p(2)}" class="grid-line diagonal-line" />
        <line x1="${p(6)}" y1="${p(6)}" x2="${p(4)}" y2="${p(4)}" class="grid-line diagonal-line" />
        <line x1="${p(0)}" y1="${p(6)}" x2="${p(2)}" y2="${p(4)}" class="grid-line diagonal-line" />
      `;
    }

    this.container.innerHTML = `
      <div class="sandstone-board" id="sandstone-board">
        <!-- SVG Grid Lines -->
        <svg class="board-svg-grid" viewBox="0 0 100 100" preserveAspectRatio="none">
          <!-- Outer Square -->
          <rect x="${p(0)}" y="${p(0)}" width="${(6 * step).toFixed(2)}" height="${(6 * step).toFixed(2)}" fill="none" class="grid-line" />
          <!-- Middle Square -->
          <rect x="${p(1)}" y="${p(1)}" width="${(4 * step).toFixed(2)}" height="${(4 * step).toFixed(2)}" fill="none" class="grid-line" />
          <!-- Inner Square -->
          <rect x="${p(2)}" y="${p(2)}" width="${(2 * step).toFixed(2)}" height="${(2 * step).toFixed(2)}" fill="none" class="grid-line" />

          <!-- Radial Midpoint Lines -->
          <!-- Top -->
          <line x1="${p(3)}" y1="${p(0)}" x2="${p(3)}" y2="${p(2)}" class="grid-line" />
          <!-- Bottom -->
          <line x1="${p(3)}" y1="${p(4)}" x2="${p(3)}" y2="${p(6)}" class="grid-line" />
          <!-- Left -->
          <line x1="${p(0)}" y1="${p(3)}" x2="${p(2)}" y2="${p(3)}" class="grid-line" />
          <!-- Right -->
          <line x1="${p(4)}" y1="${p(3)}" x2="${p(6)}" y2="${p(3)}" class="grid-line" />

          ${diagonalSvg}
        </svg>

        <!-- Points Layer -->
        <div class="board-points-layer" id="points-layer"></div>

        <!-- Flash Mill Overlay -->
        <div class="mill-flash-overlay" id="mill-flash">✦ DAHDI! (MILL FORMED) ✦</div>
      </div>
    `;

    const pointsLayer = document.getElementById('points-layer');
    this.coords.forEach(pt => {
      const el = document.createElement('div');
      el.className = 'board-point';
      el.id = `pt-${pt.id}`;
      el.style.left = `${pt.pctX}%`;
      el.style.top = `${pt.pctY}%`;
      el.setAttribute('data-point-id', pt.id);
      el.setAttribute('aria-label', `Point ${pt.id}: ${pt.name}`);

      el.innerHTML = `<div class="point-recess"></div>`;
      el.addEventListener('click', () => this.onPointClick(pt.id));
      pointsLayer.appendChild(el);
    });
  }

  updateBoardState(state, rules, selectedPoint = null, hintMove = null) {
    const isRemoving = state.subState === SUB_STATE.REMOVING;
    const activeSide = state.toMove;
    const enemySide = state.getOpponent(activeSide);
    const validRemovals = isRemoving ? rules.getValidRemovals(state, enemySide) : [];

    let legalDests = [];
    if (selectedPoint !== null && !isRemoving) {
      legalDests = rules.getLegalDestinations(state, selectedPoint);
    }

    const currentPhase = state.getPhase(activeSide);

    for (let i = 0; i < 24; i++) {
      const ptEl = document.getElementById(`pt-${i}`);
      if (!ptEl) continue;

      const occupant = state.cells[i];
      const isSelected = selectedPoint === i;
      const isLegalDest = legalDests.includes(i);
      const isRemovable = validRemovals.includes(i);
      const inMill = occupant !== PLAYER_SIDE.NONE && rules.isPieceInMill(state, i, occupant);

      // Clean point classes
      ptEl.className = 'board-point';
      if (currentPhase === GAME_PHASE.PLACEMENT && occupant === PLAYER_SIDE.NONE && !isRemoving) {
        ptEl.classList.add('can-place');
      }
      if (isLegalDest) {
        ptEl.classList.add('legal-dest');
      }

      // Check if hint applies here
      const isHintTarget = hintMove && (
        (hintMove.type === 'place' && hintMove.to === i) ||
        (hintMove.type === 'move' && (hintMove.from === i || hintMove.to === i)) ||
        (hintMove.type === 'remove' && hintMove.point === i)
      );

      // Render inner content
      let content = `<div class="point-recess"></div>`;

      // Render Piece if occupied
      if (occupant !== PLAYER_SIDE.NONE) {
        const sideClass = occupant === PLAYER_SIDE.SIDE_A ? 'side-a' : 'side-b';
        const glyph = occupant === PLAYER_SIDE.SIDE_A ? '◆' : '○';
        const pieceClasses = ['game-piece', sideClass];

        if (isSelected) pieceClasses.push('is-selected');
        if (isRemovable) pieceClasses.push('can-remove');
        if (inMill) pieceClasses.push('in-mill');

        content += `
          <div class="${pieceClasses.join(' ')}" id="piece-${i}">
            <div class="glyph-badge" aria-hidden="true">${glyph}</div>
          </div>
        `;
      }

      // Render Legal Destination Marker
      if (isLegalDest) {
        content += `<div class="legal-dest-marker"></div>`;
      }

      // Render Hint Marker
      if (isHintTarget) {
        content += `<div class="hint-marker"></div>`;
      }

      ptEl.innerHTML = content;
    }
  }

  flashMill() {
    const flashEl = document.getElementById('mill-flash');
    if (!flashEl) return;
    flashEl.classList.add('active');
    setTimeout(() => {
      flashEl.classList.remove('active');
    }, 1200);
  }

  animateCapture(pointId, callback) {
    const piece = document.getElementById(`piece-${pointId}`);
    if (piece) {
      piece.classList.add('piece-captured-pop');
      setTimeout(callback, 220); // 220ms OutBack
    } else {
      callback();
    }
  }

  shakePoint(pointId) {
    const pt = document.getElementById(`pt-${pointId}`);
    if (pt) {
      pt.classList.add('illegal-shake');
      setTimeout(() => pt.classList.remove('illegal-shake'), 180);
    }
  }
}

/**
 * Marigold Petal & Gold Spark Victory Confetti
 * Adheres to Design Bible Section 4.7:
 * "Win celebration: marigold petals + gold sparks. Max 1.2s, max 60 particles."
 */
export function triggerWinConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#E8A317', '#F2BC4B', '#C8402F', '#FBF4E8', '#10727F'];
  const particles = [];
  const particleCount = 50;

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 120,
      y: canvas.height * 0.45,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 1.2) * 9,
      size: Math.random() * 8 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 12,
      opacity: 1,
    });
  }

  let startTime = performance.now();

  function animate(now) {
    const elapsed = (now - startTime) / 1000;
    if (elapsed > 1.2) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.25; // Gravity
      p.rotation += p.vRot;
      p.opacity = Math.max(0, 1 - (elapsed / 1.2));

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;

      // Draw curved marigold petal shape
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size / 2.2, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}
