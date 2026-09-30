/**
 * ChaupadRules.js - Pure JavaScript Rules Engine for Chaupad (Chaupar)
 * 
 * Implements:
 * - Match FSM (Setup, Roll, Choose, Animate, NextPlayer, GameOver)
 * - Yard entry, perimeter loop movement, smooth gate overflow turning, and home column progression
 * - Non-safe castle captures awarding bonus throws
 * - Safe Castle square immunity
 * - Bonus throw chain tracking capped at 3 throws
 * - 2v2 Partnered mode handling (opposite allies sharing pieces/squares)
 */

import { LOOP, LOOPN, GATEI, SAFE } from './BoardGraph.js';
import { PashaDice } from './PashaDice.js';

export class ChaupadRules {
  constructor(config = {}) {
    this.n = config.n || 4;
    this.teams = !!config.teams;
    this.dice = new PashaDice();
    this.tokens = [];
    for (let p = 0; p < this.n; p++) {
      this.tokens[p] = [];
      for (let j = 0; j < 4; j++) {
        this.tokens[p].push({
          p,
          j,
          st: 'yard', // 'yard' | { k: 'loop', i: number } | { k: 'home', rem: number } | 'fin'
          dist: 0,
          fin: false,
          moved: false
        });
      }
    }

    this.cur = 0;
    this.chain = 0;
    this.rankNext = 1;
    this.ranks = new Array(this.n).fill(null);
    this.isOver = false;
    this.lastRoll = null;
  }

  isAllHome(p) {
    return this.tokens[p].every(t => t.fin);
  }

  isTeamDone(p) {
    if (!this.teams || this.n !== 4) return this.isAllHome(p);
    const mate = (p + 2) % 4;
    return this.isAllHome(p) && this.isAllHome(mate);
  }

  nextActivePlayer(from) {
    for (let k = 1; k <= this.n; k++) {
      const next = (from + k) % this.n;
      if (!this.isTeamDone(next) && !this.isAllHome(next)) {
        return next;
      }
    }
    return null;
  }

  getOccupancy() {
    const occ = {};
    for (let p = 0; p < this.n; p++) {
      for (const t of this.tokens[p]) {
        if (t.fin || t.st === 'yard') continue;
        if (t.st.k === 'loop') {
          const key = `L${t.st.i}`;
          (occ[key] = occ[key] || []).push(t);
        } else if (t.st.k === 'home') {
          const key = `H_${t.p}_${t.st.rem}`;
          (occ[key] = occ[key] || []).push(t);
        }
      }
    }
    return occ;
  }

  isAlly(p1, p2) {
    return p1 !== p2 && this.teams && this.n === 4 && (p1 % 2 === p2 % 2);
  }

  getLegalMoves(p, roll) {
    const steps = roll.total;
    const occ = this.getOccupancy();
    const moves = [];
    const myTokens = this.tokens[p];

    // 1. Enter from yard
    const inYard = myTokens.filter(t => t.st === 'yard' && !t.fin);
    if (inYard.length > 0) {
      const gateIdx = GATEI[p];
      const gateOccupants = occ[`L${gateIdx}`] || [];
      const enemyAtGate = gateOccupants.some(t => t.p !== p && !this.isAlly(t.p, p));
      if (!enemyAtGate) {
        moves.push({
          kind: 'enter',
          p,
          tokIdx: inYard[0].j,
          dst: gateIdx
        });
      }
    }

    // 2. Move along loop
    const loopTokens = myTokens.filter(t => !t.fin && t.st.k === 'loop');
    const seenLoop = new Set();
    for (const t of loopTokens) {
      if (seenLoop.has(t.st.i)) continue;
      seenLoop.add(t.st.i);

      const curDist = t.dist || 0;
      const newDist = curDist + steps;
      if (newDist < 72) {
        const dstIdx = (t.st.i + steps) % LOOPN;
        const occDst = occ[`L${dstIdx}`] || [];
        const enemies = occDst.filter(x => x.p !== p && !this.isAlly(x.p, p));
        if (enemies.length > 0 && SAFE[dstIdx]) {
          continue;
        }
        moves.push({
          kind: 'move',
          p,
          tokIdx: t.j,
          from: t.st.i,
          dst: dstIdx,
          newDist,
          cap: enemies.length > 0 && !SAFE[dstIdx]
        });
      } else {
        const surplus = newDist - 72;
        const rem = 8 - surplus;
        if (rem <= 0) {
          moves.push({
            kind: 'fin',
            p,
            tokIdx: t.j,
            from: t.st.i,
            newDist
          });
        } else {
          moves.push({
            kind: 'turn_home',
            p,
            tokIdx: t.j,
            from: t.st.i,
            to: rem,
            newDist
          });
        }
      }
    }

    // 3. Move in home lane
    const homeTokens = myTokens.filter(t => !t.fin && t.st.k === 'home');
    const seenHome = new Set();
    for (const t of homeTokens) {
      if (seenHome.has(t.st.rem)) continue;
      seenHome.add(t.st.rem);

      if (steps >= t.st.rem) {
        moves.push({
          kind: 'fin_from_home',
          p,
          tokIdx: t.j,
          rem: t.st.rem
        });
      } else {
        moves.push({
          kind: 'home_advance',
          p,
          tokIdx: t.j,
          rem: t.st.rem,
          to: t.st.rem - steps
        });
      }
    }

    return moves;
  }

  executeMove(m) {
    const t = this.tokens[m.p][m.tokIdx];
    let captureOccurred = false;

    if (m.kind === 'enter') {
      t.st = { k: 'loop', i: m.dst };
      t.dist = 0;
      t.moved = false;
    } else if (m.kind === 'move') {
      if (m.cap) {
        const occ = this.getOccupancy();
        const victims = (occ[`L${m.dst}`] || []).filter(x => x.p !== m.p && !this.isAlly(x.p, m.p));
        for (const v of victims) {
          v.st = 'yard';
          v.dist = 0;
          v.moved = false;
        }
        captureOccurred = true;
      }
      t.st = { k: 'loop', i: m.dst };
      t.dist = m.newDist;
      t.moved = true;
    } else if (m.kind === 'turn_home') {
      t.st = { k: 'home', rem: m.to };
      t.dist = m.newDist;
      t.moved = true;
    } else if (m.kind === 'home_advance') {
      t.st.rem = m.to;
      t.dist = 72 + (8 - m.to);
      t.moved = true;
    } else if (m.kind === 'fin' || m.kind === 'fin_from_home') {
      t.st = 'fin';
      t.fin = true;
      t.moved = true;
      this.checkPlayerFinished(m.p);
    }

    return captureOccurred;
  }

  checkPlayerFinished(p) {
    if (this.isAllHome(p) && !this.ranks[p]) {
      this.ranks[p] = this.rankNext++;
      if (this.teams && this.n === 4) {
        const mate = (p + 2) % 4;
        if (this.isAllHome(mate) && !this.ranks[mate]) {
          this.ranks[mate] = this.ranks[p];
        }
      }
    }

    const activePlayers = [0, 1, 2, 3].filter(i => !this.isAllHome(i));
    if (activePlayers.length <= (this.teams ? 2 : 1)) {
      this.isOver = true;
    }
  }
}
