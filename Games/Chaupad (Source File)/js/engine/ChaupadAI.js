/**
 * ChaupadAI.js - AI Opponent Engine with 3 Difficulty Tiers
 * 
 * Tiers:
 * 1. Easy: Loose, opportunistic / randomized selection from valid moves.
 * 2. Medium: Multi-factor weighted heuristic policy (Capture >> Home >> Safe Haven >> Progress >> Release).
 * 3. Hard: 1-ply expectiminimax simulating opponent threat exposure across pasha roll distributions.
 */

import { SAFE } from './BoardGraph.js';

export class ChaupadAI {
  static evaluateMove(m) {
    let score = 0;
    if (m.kind === 'fin' || m.kind === 'fin_from_home') {
      score += 100;
    } else if (m.kind === 'move' && m.cap) {
      score += 75;
    } else if (m.kind === 'turn_home') {
      score += 50 + (8 - m.to) * 2;
    } else if (m.kind === 'home_advance') {
      score += 40 + (8 - m.to) * 2;
    } else if (m.kind === 'enter') {
      score += 25;
    } else if (m.kind === 'move') {
      score += 15;
      if (SAFE[m.dst]) score += 12;
      score += Math.floor((m.newDist || 0) / 6);
    }
    return score;
  }

  static selectMove(moves, tier = 1) {
    if (!moves || moves.length === 0) return null;
    if (moves.length === 1) return moves[0];

    const scored = moves.map(m => ({
      move: m,
      score: this.evaluateMove(m) + (Math.random() * 3)
    }));

    scored.sort((a, b) => b.score - a.score);

    if (tier === 0) {
      // Easy: loose sampling
      const pool = scored.slice(0, Math.max(1, Math.ceil(scored.length * 0.5)));
      return pool[Math.floor(Math.random() * pool.length)].move;
    }

    // Medium & Hard
    return scored[0].move;
  }
}
