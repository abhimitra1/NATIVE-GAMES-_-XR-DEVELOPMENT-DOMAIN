/**
 * CowrieDice & Rules Core (Shared Dice Service)
 * Specification derived from 18_Kaudi.docx (Centurion University - IKS Collection)
 * Pure engine-agnostic logic with seeded/unseeded RNG and configurable value tables.
 */

class CowrieDice {
  constructor(options = {}) {
    this.shellCount = options.shellCount || 4;
    this.prngSeed = options.seed || null;
    this.rng = this.initRNG(this.prngSeed);
  }

  initRNG(seed) {
    if (seed !== null && seed !== undefined) {
      // Mulberry32 deterministic PRNG
      let s = Math.abs(seed) | 0;
      return function() {
        s |= 0; s = s + 0x6D2B79F5 | 0;
        let t = Math.imul(s ^ s >>> 15, 1 | s);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      };
    }
    return Math.random;
  }

  setSeed(seed) {
    this.prngSeed = seed;
    this.rng = this.initRNG(seed);
  }

  setShellCount(count) {
    this.shellCount = Math.max(4, Math.min(7, count));
  }

  /**
   * Rolls the cowrie shells
   * Returns:
   * {
   *   shellCount: number,
   *   upCount: number,
   *   downCount: number,
   *   shells: Array<{ up: boolean, angle: number, x: number, y: number }>,
   *   bitmask: number,
   *   points: number,
   *   isBonus: boolean,
   *   isBust: boolean,
   *   name: string
   * }
   */
  roll(gameMode = 'classic', bustThreshold = 0) {
    const shells = [];
    let bitmask = 0;
    let upCount = 0;

    // Approximate real-life cowrie landing probability:
    // Natural cowrie shells have a slightly heavier dorsal dome, so mouth-up is around 45% - 48%
    const pMouthUp = 0.47;

    for (let i = 0; i < this.shellCount; i++) {
      const isUp = this.rng() < pMouthUp;
      if (isUp) {
        upCount++;
        bitmask |= (1 << i);
      }
      shells.push({
        id: i,
        up: isUp,
        // Visual scatter offsets
        angle: Math.floor(this.rng() * 360),
        scatterX: (this.rng() - 0.5) * 160,
        scatterY: (this.rng() - 0.5) * 160,
        pitch: isUp ? (this.rng() * 12 - 6) : (180 + this.rng() * 14 - 7),
        roll: (this.rng() - 0.5) * 25
      });
    }

    const downCount = this.shellCount - upCount;
    const scoreData = this.calculateScore(upCount, this.shellCount, gameMode, bustThreshold);

    return {
      shellCount: this.shellCount,
      upCount,
      downCount,
      shells,
      bitmask,
      ...scoreData
    };
  }

  /**
   * Authentic scoring system based on Anthology of Native & Indigenous Sports of India
   * For 4 Shells:
   * 0 Up (all mouth-down): 8 points + Bonus Throw (Ashta / Royal roll)
   * 1 Up (3 down): 1 point
   * 2 Up (2 down): 2 points (or 0 / bust in press-your-luck mode)
   * 3 Up (1 down): 3 points
   * 4 Up (all mouth-up): 4 points + Bonus Throw (Chhaka)
   */
  calculateScore(upCount, totalShells, gameMode, bustThreshold) {
    let points = 0;
    let isBonus = false;
    let isBust = false;
    let name = '';

    if (totalShells === 4) {
      if (upCount === 0) {
        points = 8;
        isBonus = true;
        name = 'Ashta (All Down - 8 Pts + Bonus!)';
      } else if (upCount === 4) {
        points = 4;
        isBonus = true;
        name = 'Chhaka (All Up - 4 Pts + Bonus!)';
      } else if (upCount === 1) {
        points = 1;
        name = '1 Mouth Up (1 Pt)';
      } else if (upCount === 2) {
        if (gameMode === 'press_your_luck' && bustThreshold === 2) {
          // Hardcore variant: 2 up is bust
          points = 0;
          isBust = true;
          name = 'Bust! (2 Mouth Up)';
        } else {
          points = 2;
          name = '2 Mouth Up (2 Pts)';
        }
      } else if (upCount === 3) {
        points = 3;
        name = '3 Mouth Up (3 Pts)';
      }
    } else if (totalShells === 6) {
      // 6-cowrie variant (Ashta Chamma / Chauka Bara style)
      if (upCount === 0) {
        points = 6;
        isBonus = true;
        name = '6 Down (6 Pts + Bonus!)';
      } else if (upCount === 6) {
        points = 12;
        isBonus = true;
        name = '6 Up (12 Pts + Bonus!)';
      } else if (upCount === 1) {
        points = 10;
        isBonus = true;
        name = '1 Up Special (10 Pts + Bonus!)';
      } else {
        points = upCount;
        name = `${upCount} Mouth Up (${upCount} Pts)`;
      }
    } else if (totalShells === 7) {
      // 7-cowrie variant (Pachisi / Chaupar style)
      if (upCount === 0) {
        points = 7;
        isBonus = true;
        name = '7 Down (7 Pts + Bonus!)';
      } else if (upCount === 7) {
        points = 14;
        isBonus = true;
        name = '7 Up (14 Pts + Bonus!)';
      } else if (upCount === 1) {
        points = 10;
        isBonus = true;
        name = '1 Up Special (10 Pts + Bonus!)';
      } else {
        points = upCount;
        name = `${upCount} Mouth Up (${upCount} Pts)`;
      }
    }

    // Bust detection in Press-Your-Luck if points === 0
    if (gameMode === 'press_your_luck' && points === 0) {
      isBust = true;
      name = 'Bust! No Points';
    }

    return { points, isBonus, isBust, name };
  }

  /**
   * Expected Value and Probability Table for AI & Player Help
   */
  getProbabilities(totalShells = 4) {
    const p = 0.47;
    const probs = [];
    const n = totalShells;

    function nCr(n, r) {
      if (r < 0 || r > n) return 0;
      if (r === 0 || r === n) return 1;
      let res = 1;
      for (let i = 1; i <= r; i++) {
        res = (res * (n - i + 1)) / i;
      }
      return res;
    }

    for (let k = 0; k <= n; k++) {
      const prob = nCr(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
      const score = this.calculateScore(k, n, 'classic', 0);
      probs.push({
        upCount: k,
        probability: prob,
        points: score.points,
        isBonus: score.isBonus,
        name: score.name
      });
    }

    const expectedValue = probs.reduce((sum, item) => sum + item.probability * item.points, 0);
    return { probs, expectedValue };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CowrieDice;
}
