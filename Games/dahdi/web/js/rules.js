/**
 * DAHDI (DHD) - RULES ENGINE & STATE LOGIC
 * Replicates the pure C# MillRules / MillState architecture.
 */

import {
  PLAYER_SIDE,
  GAME_PHASE,
  SUB_STATE,
  TOTAL_PIECES_PER_PLAYER,
  getBoardConfiguration
} from './constants.js';

export class MillState {
  constructor(useDiagonals = false) {
    this.useDiagonals = useDiagonals;
    this.config = getBoardConfiguration(useDiagonals);
    
    // 24 cells on the board: 0 = Empty, 1 = Side A (Peacock), 2 = Side B (Haldi)
    this.cells = new Array(24).fill(PLAYER_SIDE.NONE);

    this.inHandA = TOTAL_PIECES_PER_PLAYER;
    this.inHandB = TOTAL_PIECES_PER_PLAYER;
    this.toMove = PLAYER_SIDE.SIDE_A;
    this.subState = SUB_STATE.NORMAL;
    this.winner = null; // null | 1 | 2 | 'DRAW'

    this.lastMove = null;
    this.moveCount = 0;
  }

  clone() {
    const copy = new MillState(this.useDiagonals);
    copy.cells = [...this.cells];
    copy.inHandA = this.inHandA;
    copy.inHandB = this.inHandB;
    copy.toMove = this.toMove;
    copy.subState = this.subState;
    copy.winner = this.winner;
    copy.lastMove = this.lastMove ? { ...this.lastMove } : null;
    copy.moveCount = this.moveCount;
    return copy;
  }

  getPieceCount(side) {
    return this.cells.filter(c => c === side).length;
  }

  getInHand(side) {
    return side === PLAYER_SIDE.SIDE_A ? this.inHandA : this.inHandB;
  }

  setInHand(side, count) {
    if (side === PLAYER_SIDE.SIDE_A) this.inHandA = count;
    else this.inHandB = count;
  }

  getPhase(side = this.toMove) {
    const inHand = this.getInHand(side);
    if (inHand > 0) return GAME_PHASE.PLACEMENT;
    const onBoard = this.getPieceCount(side);
    if (onBoard === 3) return GAME_PHASE.FLYING;
    return GAME_PHASE.MOVEMENT;
  }

  getOpponent(side = this.toMove) {
    return side === PLAYER_SIDE.SIDE_A ? PLAYER_SIDE.SIDE_B : PLAYER_SIDE.SIDE_A;
  }
}

export class MillRules {
  constructor(useDiagonals = false) {
    this.config = getBoardConfiguration(useDiagonals);
  }

  setVariant(useDiagonals) {
    this.config = getBoardConfiguration(useDiagonals);
  }

  /**
   * Check if a specific point is currently part of any formed mill for a given side
   */
  isPieceInMill(state, point, side = null) {
    const occupant = state.cells[point];
    if (occupant === PLAYER_SIDE.NONE) return false;
    const checkSide = side || occupant;

    const passingMills = this.config.millsByPoint[point];
    for (const mill of passingMills) {
      if (
        state.cells[mill[0]] === checkSide &&
        state.cells[mill[1]] === checkSide &&
        state.cells[mill[2]] === checkSide
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if placing/moving to `point` creates a new mill for `side`
   */
  formsMill(state, point, side) {
    const passingMills = this.config.millsByPoint[point];
    for (const mill of passingMills) {
      const [p1, p2, p3] = mill;
      const c1 = p1 === point ? side : state.cells[p1];
      const c2 = p2 === point ? side : state.cells[p2];
      const c3 = p3 === point ? side : state.cells[p3];

      if (c1 === side && c2 === side && c3 === side) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if ALL pieces on board for `side` are part of formed mills
   */
  allPiecesInMills(state, side) {
    for (let i = 0; i < 24; i++) {
      if (state.cells[i] === side) {
        if (!this.isPieceInMill(state, i, side)) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * List valid enemy pieces that can be captured/removed
   * Rule: cannot remove from a mill unless all opponent pieces are in mills
   */
  getValidRemovals(state, enemySide) {
    const valid = [];
    const allInMills = this.allPiecesInMills(state, enemySide);

    for (let i = 0; i < 24; i++) {
      if (state.cells[i] === enemySide) {
        if (allInMills || !this.isPieceInMill(state, i, enemySide)) {
          valid.push(i);
        }
      }
    }
    return valid;
  }

  /**
   * Get legal destination points for a piece moving from `fromPoint`
   */
  getLegalDestinations(state, fromPoint) {
    const side = state.cells[fromPoint];
    if (side !== state.toMove) return [];

    const phase = state.getPhase(side);
    if (phase === GAME_PHASE.FLYING) {
      // Can jump to any empty point
      const empties = [];
      for (let i = 0; i < 24; i++) {
        if (state.cells[i] === PLAYER_SIDE.NONE) empties.push(i);
      }
      return empties;
    } else {
      // Regular movement: adjacent empty points
      const neighbors = this.config.adjacency[fromPoint] || [];
      return neighbors.filter(pt => state.cells[pt] === PLAYER_SIDE.NONE);
    }
  }

  /**
   * Enumerate all legal moves for current player
   */
  getLegalMoves(state) {
    if (state.winner !== null) return [];

    const side = state.toMove;
    const enemy = state.getOpponent(side);

    // If currently in REMOVING sub-state, moves are removals
    if (state.subState === SUB_STATE.REMOVING) {
      const removals = this.getValidRemovals(state, enemy);
      return removals.map(pt => ({
        type: 'remove',
        point: pt
      }));
    }

    const phase = state.getPhase(side);
    const moves = [];

    if (phase === GAME_PHASE.PLACEMENT) {
      // Place piece on any empty cell
      for (let i = 0; i < 24; i++) {
        if (state.cells[i] === PLAYER_SIDE.NONE) {
          const createsMill = this.formsMill(state, i, side);
          if (createsMill) {
            // For each valid removal, simulate the combined move
            const nextState = state.clone();
            nextState.cells[i] = side;
            const validRemovals = this.getValidRemovals(nextState, enemy);
            if (validRemovals.length > 0) {
              for (const rem of validRemovals) {
                moves.push({ type: 'place', to: i, remove: rem });
              }
            } else {
              moves.push({ type: 'place', to: i, remove: null });
            }
          } else {
            moves.push({ type: 'place', to: i, remove: null });
          }
        }
      }
    } else {
      // Movement or Flying
      for (let from = 0; from < 24; from++) {
        if (state.cells[from] === side) {
          const dests = this.getLegalDestinations(state, from);
          for (const to of dests) {
            // Temporarily lift piece from 'from' to test mill
            const tempState = state.clone();
            tempState.cells[from] = PLAYER_SIDE.NONE;
            const createsMill = this.formsMill(tempState, to, side);

            if (createsMill) {
              tempState.cells[to] = side;
              const validRemovals = this.getValidRemovals(tempState, enemy);
              if (validRemovals.length > 0) {
                for (const rem of validRemovals) {
                  moves.push({ type: 'move', from, to, remove: rem });
                }
              } else {
                moves.push({ type: 'move', from, to, remove: null });
              }
            } else {
              moves.push({ type: 'move', from, to, remove: null });
            }
          }
        }
      }
    }

    return moves;
  }

  /**
   * Apply a move and return the resulting state
   */
  applyMove(state, move) {
    const next = state.clone();
    const side = next.toMove;
    const enemy = next.getOpponent(side);

    if (move.type === 'place') {
      next.cells[move.to] = side;
      next.setInHand(side, next.getInHand(side) - 1);
      next.lastMove = { type: 'place', to: move.to };

      if (move.remove !== null && move.remove !== undefined) {
        next.cells[move.remove] = PLAYER_SIDE.NONE;
        next.lastMove.captured = move.remove;
      }
    } else if (move.type === 'move') {
      next.cells[move.from] = PLAYER_SIDE.NONE;
      next.cells[move.to] = side;
      next.lastMove = { type: 'move', from: move.from, to: move.to };

      if (move.remove !== null && move.remove !== undefined) {
        next.cells[move.remove] = PLAYER_SIDE.NONE;
        next.lastMove.captured = move.remove;
      }
    } else if (move.type === 'remove') {
      next.cells[move.point] = PLAYER_SIDE.NONE;
      next.lastMove = { type: 'remove', point: move.point };
      next.subState = SUB_STATE.NORMAL;
    }

    next.moveCount++;
    next.toMove = enemy;

    // Check for win / terminal state
    this.evaluateTerminal(next);

    return next;
  }

  /**
   * Check if game has ended
   * Win condition:
   * 1. Opponent reduced to 2 pieces after placement phase
   * 2. Opponent has no legal moves (immobilized)
   */
  evaluateTerminal(state) {
    const side = state.toMove;
    const onBoard = state.getPieceCount(side);
    const inHand = state.getInHand(side);

    // If opponent has <= 2 pieces once placement is complete, they lose
    if (inHand === 0 && onBoard <= 2) {
      state.winner = state.getOpponent(side);
      return;
    }

    // If opponent has no in hand and no legal movement destinations, they are immobilized and lose
    if (inHand === 0) {
      let hasLegalMove = false;
      const phase = state.getPhase(side);

      if (phase === GAME_PHASE.FLYING) {
        // Can fly to any empty point
        hasLegalMove = state.cells.includes(PLAYER_SIDE.NONE);
      } else {
        // Normal movement
        for (let i = 0; i < 24; i++) {
          if (state.cells[i] === side) {
            const dests = this.getLegalDestinations(state, i);
            if (dests.length > 0) {
              hasLegalMove = true;
              break;
            }
          }
        }
      }

      if (!hasLegalMove) {
        state.winner = state.getOpponent(side);
        return;
      }
    }
  }
}
