class PachisiEngine {
  constructor() {
    this.turn = 0; // Player index: 0, 1, 2, 3
    this.safeTiles = [8, 17, 25, 34, 42, 51];
    this.pieces = this.initPieces();
  }

  initPieces() {
    const pieces = [];
    for (let p = 0; p < 4; p++) {
      for (let i = 0; i < 4; i++) {
        pieces.push({ id: `p${p}_${i}`, playerId: p, state: 'IN_YARD', stepProgress: -1 });
      }
    }
    return pieces;
  }

  rollCowries() {
    let shellsUp = 0;
    for (let i = 0; i < 6; i++) {
      if (Math.random() < 0.5) shellsUp++;
    }

    const rules = {
      0: { steps: 10, bonus: true, canSpawn: true },
      1: { steps: 1,  bonus: false, canSpawn: false },
      2: { steps: 2,  bonus: false, canSpawn: false },
      3: { steps: 3,  bonus: false, canSpawn: false },
      4: { steps: 4,  bonus: false, canSpawn: false },
      5: { steps: 5,  bonus: true, canSpawn: false },
      6: { steps: 6,  bonus: true, canSpawn: true }
    };

    return rules[shellsUp];
  }

  canMove(piece, roll) {
    if (piece.state === 'FINISHED') return false;
    if (piece.state === 'IN_YARD') return roll.canSpawn;

    const totalTrackSteps = 68;
    return (piece.stepProgress + roll.steps) <= totalTrackSteps;
  }

  executeMove(piece, roll) {
    if (piece.state === 'IN_YARD') {
      piece.state = 'ACTIVE';
      piece.stepProgress = 0;
      return { captured: false };
    }

    piece.stepProgress += roll.steps;

    if (piece.stepProgress === 68) {
      piece.state = 'FINISHED';
      return { captured: false };
    }

    return this.resolveCollision(piece);
  }

  resolveCollision(activePiece) {
    const tileIndex = this.getGlobalTileIndex(activePiece);
    if (this.safeTiles.includes(tileIndex)) return { captured: false };

    const opponent = this.pieces.find(p => 
      p.id !== activePiece.id && 
      p.playerId !== activePiece.playerId &&
      p.state === 'ACTIVE' &&
      this.getGlobalTileIndex(p) === tileIndex
    );

    if (opponent) {
      opponent.state = 'IN_YARD';
      opponent.stepProgress = -1;
      return { captured: true };
    }

    return { captured: false };
  }

  getGlobalTileIndex(piece) {
    const playerStartOffsets = [0, 17, 34, 51];
    return (playerStartOffsets[piece.playerId] + piece.stepProgress) % 68;
  }
}

// --- RUN A TEST GAME SIMULATION ---
const game = new PachisiEngine();
console.log("=== PACHISI TEST RUN ===");

const rollResult = game.rollCowries();
console.log("Rolled Cowries:", rollResult);

const redPawn = game.pieces[0];
const allowed = game.canMove(redPawn, rollResult);
console.log(`Can Red piece '${redPawn.id}' move?`, allowed);

if (allowed) {
  const outcome = game.executeMove(redPawn, rollResult);
  console.log("Move Result:", outcome);
  console.log("Pawn Status After Move:", redPawn);
} else {
  console.log("Needs a 6 or 10 (all flat or all domed) to leave the yard.");
}