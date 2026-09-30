/**
 * BoardGraph.js - Topological Graph for Chaupad (Chaupar)
 * 
 * Defines the canonical 4-arm cruciform board:
 * - 19x19 cell grid coordinate space (center Charkoni at [9,9] to [10,10])
 * - 72-tile perimeter loop traversing all 4 arms in counter-clockwise order
 * - 4 Player gates (South, West, North, East)
 * - Safe Castle squares (Goths) granting capture immunity
 * - Private home columns leading to the central Charkoni
 */

export function buildLoop() {
  const segs = [
    { out: [11, 8], d: [1, 0], n: 8, tipD: [0, 1], tipN: 2, inC: [17, 10], inD: [-1, 0], inN: 7, corner: [10, 10] },
    { out: [10, 11], d: [0, 1], n: 8, tipD: [-1, 0], tipN: 2, inC: [8, 17], inD: [0, -1], inN: 7, corner: [8, 10] },
    { out: [7, 10], d: [-1, 0], n: 8, tipD: [0, -1], tipN: 2, inC: [1, 8], inD: [1, 0], inN: 7, corner: [8, 8] },
    { out: [8, 7], d: [0, -1], n: 8, tipD: [1, 0], tipN: 2, inC: [10, 1], inD: [0, 1], inN: 7, corner: [10, 8] }
  ];
  const loop = [];
  segs.forEach(s => {
    let r = s.out[0], c = s.out[1];
    for (let i = 0; i < s.n; i++) { loop.push([r, c]); r += s.d[0]; c += s.d[1]; }
    r -= s.d[0]; c -= s.d[1];
    for (let i = 0; i < s.tipN; i++) { r += s.tipD[0]; c += s.tipD[1]; loop.push([r, c]); }
    r = s.inC[0]; c = s.inC[1];
    for (let i = 0; i < s.inN; i++) { loop.push([r, c]); r += s.inD[0]; c += s.inD[1]; }
    r -= s.inD[0]; c -= s.inD[1];
    loop.push(s.corner);
  });
  return loop;
}

export const LOOP = buildLoop();
export const LOOPN = LOOP.length; // 72 cells
export const LOOPI = {};
LOOP.forEach((cell, i) => { LOOPI[`${cell[0]},${cell[1]}`] = i; });

export const SIDES = {
  S: {
    id: 0, key: 'S', name: 'Sindoor', hindi: 'सिन्दूर', odia: 'ସିନ୍ଦୂର', sym: '◆',
    colour: '#C8402F', dark: '#8f2c1e',
    gate: [18, 9],
    home: [[17, 9], [16, 9], [15, 9], [14, 9], [13, 9], [12, 9], [11, 9]],
    finish: [10, 9],
    tray: [18.9, 9]
  },
  W: {
    id: 1, key: 'W', name: 'Mayur', hindi: 'मयूर', odia: 'ମୟୂର', sym: '▲',
    colour: '#10727F', dark: '#0a4d56',
    gate: [9, 0],
    home: [[9, 1], [9, 2], [9, 3], [9, 4], [9, 5], [9, 6], [9, 7]],
    finish: [9, 8],
    tray: [9, -0.9]
  },
  N: {
    id: 2, key: 'N', name: 'Haldi', hindi: 'हल्दी', odia: 'ହଳଦୀ', sym: '●',
    colour: '#E8A317', dark: '#a8730e',
    gate: [0, 9],
    home: [[1, 9], [2, 9], [3, 9], [4, 9], [5, 9], [6, 9], [7, 9]],
    finish: [8, 9],
    tray: [-0.9, 9]
  },
  E: {
    id: 3, key: 'E', name: 'Neel', hindi: 'नील', odia: 'ନୀଳ', sym: '★',
    colour: '#2F4B7C', dark: '#1f3052',
    gate: [9, 18],
    home: [[9, 17], [9, 16], [9, 15], [9, 14], [9, 13], [9, 12], [9, 11]],
    finish: [9, 10],
    tray: [9, 18.9]
  }
};

export const PORDER = ['S', 'W', 'N', 'E'];
export const PS = PORDER.map(k => SIDES[k]);
export const GATEI = PORDER.map(k => LOOPI[`${SIDES[k].gate[0]},${SIDES[k].gate[1]}`]);

export const SAFE = {};
PORDER.forEach(k => {
  const g = SIDES[k].gate;
  SAFE[LOOPI[`${g[0]},${g[1]}`]] = true;
});
[[10, 10], [8, 10], [8, 8], [10, 8]].forEach(c => {
  SAFE[LOOPI[`${c[0]},${c[1]}`]] = true;
});

export function getHomeCell(playerIndex, rem) {
  const s = PS[playerIndex];
  if (rem === 8) return s.gate;
  if (rem >= 1 && rem <= 7) return s.home[7 - rem];
  return s.finish;
}
