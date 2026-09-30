/**
 * Ashtaa Chemmaa - Smart AI Bot Controller
 * 
 * Features heuristic decision making:
 * - Prioritizes goal finishes (Progress 24)
 * - Prioritizes opponent captures (especially deep pieces)
 * - Escapes vulnerable unsafe positions
 * - Lands on safe squares (Gaddis)
 * - Enters reserve pieces on 4 or 8 rolls
 * - Calculates risk of landing on unsafe cells
 * - 3 Difficulty levels: Easy, Medium, Master
 */

class SmartBot {
  constructor(difficulty = 'medium') {
    this.difficulty = difficulty; // 'easy' | 'medium' | 'master'
  }

  /**
   * Chooses the best piece among legal pieces
   */
  chooseMove(legalPieces, allPieces, playerIndex, movement, rules, playerHasCaptured = false) {
    if (!legalPieces || legalPieces.length === 0) return null;
    if (legalPieces.length === 1) return legalPieces[0];

    // Easy mode has a 35% chance to make a random legal move
    if (this.difficulty === 'easy' && Math.random() < 0.35) {
      const randomIndex = Math.floor(Math.random() * legalPieces.length);
      return legalPieces[randomIndex];
    }

    let bestScore = -Infinity;
    let bestPiece = legalPieces[0];

    for (const piece of legalPieces) {
      const score = this.evaluatePieceMove(piece, allPieces, playerIndex, movement, rules, playerHasCaptured);
      // Small random tie-breaker
      const jitter = (Math.random() - 0.5) * 5;
      const finalScore = score + jitter;

      if (finalScore > bestScore) {
        bestScore = finalScore;
        bestPiece = piece;
      }
    }

    return bestPiece;
  }

  /**
   * Scores an individual piece move
   */
  evaluatePieceMove(piece, allPieces, playerIndex, movement, rules, playerHasCaptured) {
    const preview = rules.getMovePreview(piece, allPieces, movement);
    if (!preview) return -9999;

    let score = 0;
    const targetCell = preview.targetCell;
    const targetProgress = preview.targetProgress;

    // 1. Reaching Goal / Finishing (Ultimate Goal!)
    if (targetProgress === BoardGeometry.FINISH_PROGRESS) {
      score += 2500;
      return score;
    }

    // 2. Capturing an opponent piece
    if (preview.capturedPiece) {
      const opponentProgress = preview.capturedPiece.currentProgress;
      score += 900 + (opponentProgress * 20); // More valuable to capture advanced pieces!
    }

    // 3. Entering a piece from home reserve (progress -1 -> 0)
    if (preview.isEntering) {
      const piecesInPlay = allPieces.filter(p => p.playerIndex === playerIndex && p.currentProgress >= 0 && p.currentProgress < 24).length;
      if (piecesInPlay === 0) {
        score += 650; // Critical to get at least one piece moving!
      } else if (piecesInPlay < 3) {
        score += 380;
      } else {
        score += 220;
      }
    }

    // 4. Moving onto a Safe Square
    if (preview.isSafe) {
      score += 320;
    }

    // 5. Escaping danger: Was the piece currently on an unsafe cell under threat?
    if (piece.currentProgress >= 0 && !BoardGeometry.isSafeCell(piece.r, piece.c)) {
      const isCurrentlyThreatened = this.isThreatenedAt(piece.r, piece.c, playerIndex, allPieces);
      if (isCurrentlyThreatened) {
        score += 400; // Good incentive to evacuate!
      }
    }

    // 6. Threat assessment at target cell (if target is unsafe)
    if (!preview.isSafe && this.difficulty !== 'easy') {
      const targetThreatened = this.isThreatenedAt(targetCell.r, targetCell.c, playerIndex, allPieces);
      if (targetThreatened) {
        score -= 280; // Penalty for landing in danger
      }
    }

    // 7. General progress bonus
    score += (targetProgress * 12);

    // 8. Entering inner ring bonus
    if (piece.currentProgress < 16 && targetProgress >= 16) {
      score += 180;
    }

    return score;
  }

  /**
   * Checks whether cell (r, c) can be reached by any opponent piece
   */
  isThreatenedAt(r, c, ownPlayerIndex, allPieces) {
    const dangerousRolls = [1, 2, 3, 4, 8];

    for (const other of allPieces) {
      if (other.playerIndex === ownPlayerIndex || other.currentProgress < 0 || other.currentProgress >= 24) {
        continue;
      }

      // Check if any standard roll for this opponent lands on (r, c)
      for (const roll of dangerousRolls) {
        const testProgress = other.currentProgress + roll;
        if (testProgress <= 24) {
          const testCell = BoardGeometry.getCell(other.playerIndex, testProgress);
          if (testCell && testCell.r === r && testCell.c === c) {
            return true;
          }
        }
      }
    }

    return false;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SmartBot;
}
