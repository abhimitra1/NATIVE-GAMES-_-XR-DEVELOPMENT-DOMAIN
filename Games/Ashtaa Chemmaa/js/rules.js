/**
 * Ashtaa Chemmaa - Game Rules Engine
 * 
 * Implements full rules matching RaceRules.cs, CowrieManager.cs, and GameManager.cs:
 * - 4 Cowrie shells evaluation
 * - Piece move legality and stacking constraints
 * - Safe square immunity
 * - Capture logic & return to base
 * - Optional classic toggle (Inner ring unlock upon capture)
 * - Victory detection
 */

class GameRules {
  constructor(options = {}) {
    this.allowSpecialRollEntry = options.allowSpecialRollEntry ?? true;
    this.entryMoveValues = options.entryMoveValues ?? [4, 8];
    this.allowCapture = options.allowCapture ?? true;
    this.captureGivesExtraTurn = options.captureGivesExtraTurn ?? true;
    this.allowOwnStackOnSafeSquares = options.allowOwnStackOnSafeSquares ?? true;
    this.requireExactFinish = options.requireExactFinish ?? true;
    this.requireCaptureForInnerRing = options.requireCaptureForInnerRing ?? false;
  }

  /**
   * Roll 4 cowrie shells
   * Returns: {
   *   openCount: 0..4,
   *   movement: 1, 2, 3, 4, 8,
   *   extraTurn: boolean,
   *   name: "Ashta" | "Chamma" | "Move X",
   *   shells: [boolean, boolean, boolean, boolean] (true = open, false = closed)
   * }
   */
  rollCowries() {
    const shells = [];
    let openCount = 0;

    for (let i = 0; i < 4; i++) {
      const isOpen = Math.random() < 0.5;
      shells.push(isOpen);
      if (isOpen) openCount++;
    }

    let movement;
    let extraTurn = false;
    let name;

    if (openCount === 0) {
      movement = 8;
      extraTurn = true;
      name = 'ASHTA!';
    } else if (openCount === 4) {
      movement = 4;
      extraTurn = true;
      name = 'CHAMMA!';
    } else {
      movement = openCount;
      extraTurn = false;
      name = `MOVE ${movement}`;
    }

    return {
      openCount,
      movement,
      extraTurn,
      name,
      shells
    };
  }

  /**
   * Checks if a specific piece can move with the given movement roll
   */
  canPieceMove(piece, allPieces, currentPlayerIndex, movement, playerHasCaptured = false) {
    if (!piece || piece.playerIndex !== currentPlayerIndex) {
      return false;
    }

    // Already reached center goal
    if (piece.currentProgress >= BoardGeometry.FINISH_PROGRESS) {
      return false;
    }

    // Piece in Home Pouch (progress = -1)
    if (piece.currentProgress < 0) {
      if (!this.allowSpecialRollEntry || !this.entryMoveValues.includes(movement)) {
        return false;
      }

      // Check if entry cell is occupied by own piece (entry cell is safe cell)
      const entryCell = BoardGeometry.getCell(piece.playerIndex, BoardGeometry.ENTRY_PROGRESS);
      if (this.allowOwnStackOnSafeSquares) {
        return true;
      }

      // If own stacking is disabled even on safe squares
      const ownOccupier = allPieces.find(p => 
        p.id !== piece.id &&
        p.playerIndex === piece.playerIndex &&
        p.currentProgress >= 0 &&
        p.currentProgress < BoardGeometry.FINISH_PROGRESS &&
        p.r === entryCell.r && p.c === entryCell.c
      );

      return !ownOccupier;
    }

    // Target progress calculation
    const targetProgress = piece.currentProgress + movement;

    // Exact finish check
    if (this.requireExactFinish && targetProgress > BoardGeometry.FINISH_PROGRESS) {
      return false;
    }

    if (targetProgress > BoardGeometry.FINISH_PROGRESS) {
      return false;
    }

    // Inner ring unlock check (if rule enabled)
    if (this.requireCaptureForInnerRing && !playerHasCaptured) {
      // If moving from outer track (progress < 16) into inner track (targetProgress >= 16)
      if (piece.currentProgress < 16 && targetProgress >= 16) {
        return false;
      }
    }

    // Target Cell lookup
    const targetCell = BoardGeometry.getCell(piece.playerIndex, targetProgress);
    if (!targetCell) return false;

    // Safe squares check
    if (BoardGeometry.isSafeCell(targetCell.r, targetCell.c)) {
      if (this.allowOwnStackOnSafeSquares) {
        return true;
      }
    }

    // Normal square: check if an OWN piece already occupies target square
    const ownCollision = allPieces.find(p => 
      p.id !== piece.id &&
      p.playerIndex === piece.playerIndex &&
      p.currentProgress >= 0 &&
      p.currentProgress < BoardGeometry.FINISH_PROGRESS &&
      p.r === targetCell.r && p.c === targetCell.c
    );

    if (ownCollision) {
      return false;
    }

    return true;
  }

  /**
   * Get preview information for a piece move
   */
  getMovePreview(piece, allPieces, movement) {
    if (!piece || piece.currentProgress >= BoardGeometry.FINISH_PROGRESS) return null;

    let targetProgress;
    if (piece.currentProgress < 0) {
      targetProgress = BoardGeometry.ENTRY_PROGRESS;
    } else {
      targetProgress = piece.currentProgress + movement;
    }

    if (targetProgress > BoardGeometry.FINISH_PROGRESS) {
      return null;
    }

    const targetCell = BoardGeometry.getCell(piece.playerIndex, targetProgress);
    if (!targetCell) return null;

    const isSafe = BoardGeometry.isSafeCell(targetCell.r, targetCell.c);
    const isGoal = BoardGeometry.isCenterGoal(targetCell.r, targetCell.c);

    // Check for opponents that would be captured
    let capturedPiece = null;
    if (!isSafe && this.allowCapture) {
      capturedPiece = allPieces.find(p => 
        p.playerIndex !== piece.playerIndex &&
        p.currentProgress >= 0 &&
        p.currentProgress < BoardGeometry.FINISH_PROGRESS &&
        p.r === targetCell.r && p.c === targetCell.c
      ) || null;
    }

    // Step-by-step path coordinates for smooth hop animation
    const pathCoordinates = [];
    const startProgress = piece.currentProgress < 0 ? 0 : piece.currentProgress;
    for (let p = startProgress; p <= targetProgress; p++) {
      pathCoordinates.push(BoardGeometry.getCell(piece.playerIndex, p));
    }

    return {
      targetProgress,
      targetCell,
      isSafe,
      isGoal,
      capturedPiece,
      pathCoordinates,
      isEntering: piece.currentProgress < 0
    };
  }

  /**
   * Returns all pieces belonging to currentPlayerIndex that can legally move
   */
  getLegalPieces(pieces, currentPlayerIndex, movement, playerHasCaptured = false) {
    return pieces.filter(piece => 
      this.canPieceMove(piece, pieces, currentPlayerIndex, movement, playerHasCaptured)
    );
  }

  /**
   * Checks if player has won (all 4 pieces at center goal)
   */
  hasPlayerWon(playerIndex, pieces) {
    const playerPieces = pieces.filter(p => p.playerIndex === playerIndex);
    if (playerPieces.length !== 4) return false;
    return playerPieces.every(p => p.currentProgress === BoardGeometry.FINISH_PROGRESS);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameRules;
}
