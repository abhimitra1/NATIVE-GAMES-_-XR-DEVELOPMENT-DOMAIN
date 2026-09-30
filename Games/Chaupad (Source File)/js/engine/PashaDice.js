/**
 * PashaDice.js - Traditional 3-Stick Long Wooden Dice (Pasha) Engine
 * 
 * In canonical Chaupad:
 * - 3 long rectangular wooden dice
 * - Each stick has 4 long faces marked with: 1, 2, 5, 6 pips
 * - Result is sum of all three sticks (range 3 to 18)
 * - Triples (e.g. 1-1-1, 2-2-2, 5-5-5, 6-6-6) yield a grace throw (चौ) awarding a bonus roll
 */

export const PASHA_FACES = [1, 2, 5, 6];

export const PIPS = {
  1: ['c'],
  2: ['l', 'r'],
  5: ['tl', 'tr', 'c', 'bl', 'br'],
  6: ['tl', 'ml', 'bl', 'tr', 'mr', 'br']
};

export class PashaDice {
  constructor(rng = Math.random) {
    this.rng = rng;
  }

  roll() {
    const v = [
      PASHA_FACES[Math.floor(this.rng() * 4)],
      PASHA_FACES[Math.floor(this.rng() * 4)],
      PASHA_FACES[Math.floor(this.rng() * 4)]
    ];
    const total = v[0] + v[1] + v[2];
    const grace = (v[0] === v[1] && v[1] === v[2]); // All three match (Chau)
    return {
      v,
      total,
      grace,
      label: grace ? 'चौ · Bonus Throw!' : `${total} Steps`
    };
  }
}
