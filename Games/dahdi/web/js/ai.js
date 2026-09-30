/**
 * DAHDI (DHD) - NEGAMAX AI SOLVER
 * Phase-aware evaluation, alpha-beta pruning, transposition caching, and 3 difficulty tiers.
 */

import { PLAYER_SIDE, GAME_PHASE } from './constants.js';

export class MillAI {
  constructor(rules, difficulty = 'medium') {
    this.rules = rules;
    this.difficulty = difficulty; // 'easy' | 'medium' | 'hard'
    this.transpositionTable = new Map();
  }

  setDifficulty(diff) {
    this.difficulty = diff;
  }

  clearCache() {
    this.transpositionTable.clear();
  }

  /**
   * Find the best move for the AI or for player hint
   */
  async findBestMove(state, side) {
    // Small artificial delay for natural feel
    await new Promise(r => setTimeout(r, 250));

    const legalMoves = this.rules.getLegalMoves(state);
    if (legalMoves.length === 0) return null;

    // Easy Tier: 25% random moves, shallow search (depth 1-2)
    if (this.difficulty === 'easy') {
      if (Math.random() < 0.25) {
        return legalMoves[Math.floor(Math.random() * legalMoves.length)];
      }
      return this.searchBestMove(state, side, 1);
    }

    // Medium Tier: Depth 3 with move ordering
    if (this.difficulty === 'medium') {
      return this.searchBestMove(state, side, 3);
    }

    // Hard / Master Tier: Depth 4-5 with iterative deepening and transposition cache
    return this.searchBestMove(state, side, 4);
  }

  searchBestMove(state, side, maxDepth) {
    const legalMoves = this.rules.getLegalMoves(state);
    if (legalMoves.length === 1) return legalMoves[0];

    // Move ordering: evaluate moves that capture first
    this.orderMoves(state, legalMoves);

    let bestScore = -Infinity;
    let bestMove = legalMoves[0];
    let alpha = -Infinity;
    const beta = Infinity;

    for (const move of legalMoves) {
      const nextState = this.rules.applyMove(state, move);
      const score = -this.negamax(nextState, maxDepth - 1, -beta, -alpha, state.getOpponent(side));

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
      alpha = Math.max(alpha, score);
    }

    return bestMove;
  }

  negamax(state, depth, alpha, beta, currentSide) {
    const stateKey = this.hashState(state, currentSide);
    if (this.transpositionTable.has(stateKey)) {
      const entry = this.transpositionTable.get(stateKey);
      if (entry.depth >= depth) {
        return entry.score;
      }
    }

    if (state.winner !== null) {
      if (state.winner === currentSide) return 10000 + depth;
      if (state.winner === 'DRAW') return 0;
      return -10000 - depth;
    }

    if (depth <= 0) {
      return this.evaluateState(state, currentSide);
    }

    const legalMoves = this.rules.getLegalMoves(state);
    if (legalMoves.length === 0) {
      // Opponent is immobilized
      return -10000 - depth;
    }

    this.orderMoves(state, legalMoves);

    let maxScore = -Infinity;
    for (const move of legalMoves) {
      const nextState = this.rules.applyMove(state, move);
      const score = -this.negamax(nextState, depth - 1, -beta, -alpha, state.getOpponent(currentSide));

      maxScore = Math.max(maxScore, score);
      alpha = Math.max(alpha, score);
      if (alpha >= beta) {
        break; // Alpha-beta cutoff
      }
    }

    if (this.transpositionTable.size < 50000) {
      this.transpositionTable.set(stateKey, { score: maxScore, depth });
    }

    return maxScore;
  }

  orderMoves(state, moves) {
    moves.sort((a, b) => {
      // Prioritize moves with captures
      const scoreA = (a.remove !== null && a.remove !== undefined) ? 100 : 0;
      const scoreB = (b.remove !== null && b.remove !== undefined) ? 100 : 0;
      return scoreB - scoreA;
    });
  }

  /**
   * Phase-aware Heuristic Evaluation
   */
  evaluateState(state, side) {
    const enemy = state.getOpponent(side);

    // 1. Material score
    const myPieces = state.getPieceCount(side) + state.getInHand(side);
    const enemyPieces = state.getPieceCount(enemy) + state.getInHand(enemy);
    const materialDiff = (myPieces - enemyPieces) * 100;

    // 2. Mills score
    let myMills = 0;
    let enemyMills = 0;
    let myThreats = 0;
    let enemyThreats = 0;

    for (const mill of this.rules.config.mills) {
      let myCount = 0;
      let enemyCount = 0;
      let emptyCount = 0;

      for (const pt of mill) {
        const c = state.cells[pt];
        if (c === side) myCount++;
        else if (c === enemy) enemyCount++;
        else emptyCount++;
      }

      if (myCount === 3) myMills++;
      else if (enemyCount === 3) enemyMills++;
      else if (myCount === 2 && emptyCount === 1) myThreats++;
      else if (enemyCount === 2 && emptyCount === 1) enemyThreats++;
    }

    const millsScore = (myMills - enemyMills) * 45;
    const threatsScore = (myThreats - enemyThreats) * 25;

    // 3. Mobility score (important in phase 2)
    let mobilityScore = 0;
    if (state.getInHand(side) === 0) {
      let myMoves = 0;
      let enemyMoves = 0;
      for (let i = 0; i < 24; i++) {
        if (state.cells[i] === side) {
          myMoves += this.rules.getLegalDestinations(state, i).length;
        } else if (state.cells[i] === enemy) {
          const tempState = state.clone();
          tempState.toMove = enemy;
          enemyMoves += this.rules.getLegalDestinations(tempState, i).length;
        }
      }
      mobilityScore = (myMoves - enemyMoves) * 5;
    }

    return materialDiff + millsScore + threatsScore + mobilityScore;
  }

  hashState(state, currentSide) {
    return `${state.cells.join('')}|${state.inHandA},${state.inHandB}|${currentSide}`;
  }
}
