/**
 * DAHDI (DHD) - CONSTANTS & TOPOLOGY
 * Based on Centurion University Anthology (CUTM 2025) & Unity Build Blueprint
 */

export const PLAYER_SIDE = {
  NONE: 0,
  SIDE_A: 1, // Peacock (◆)
  SIDE_B: 2, // Haldi (○)
};

export const GAME_PHASE = {
  PLACEMENT: 1, // Placing 9 pieces each
  MOVEMENT: 2,  // Sliding to adjacent empty points
  FLYING: 3,    // Reduced to 3 pieces: jump anywhere
};

export const SUB_STATE = {
  NORMAL: 'NORMAL',
  REMOVING: 'REMOVING', // Just formed a mill, choose enemy piece to remove
};

export const TOTAL_PIECES_PER_PLAYER = 9;

/**
 * 24 points normalized to coordinates 0..6:
 * Outer square: points 0..7
 * Middle square: points 8..15
 * Inner square: points 16..23
 */
export const BOARD_POINTS = [
  // Outer Square
  { id: 0, x: 0, y: 0, name: 'Outer TL' },
  { id: 1, x: 3, y: 0, name: 'Outer TM' },
  { id: 2, x: 6, y: 0, name: 'Outer TR' },
  { id: 3, x: 6, y: 3, name: 'Outer MR' },
  { id: 4, x: 6, y: 6, name: 'Outer BR' },
  { id: 5, x: 3, y: 6, name: 'Outer BM' },
  { id: 6, x: 0, y: 6, name: 'Outer BL' },
  { id: 7, x: 0, y: 3, name: 'Outer ML' },

  // Middle Square
  { id: 8, x: 1, y: 1, name: 'Mid TL' },
  { id: 9, x: 3, y: 1, name: 'Mid TM' },
  { id: 10, x: 5, y: 1, name: 'Mid TR' },
  { id: 11, x: 5, y: 3, name: 'Mid MR' },
  { id: 12, x: 5, y: 5, name: 'Mid BR' },
  { id: 13, x: 3, y: 5, name: 'Mid BM' },
  { id: 14, x: 1, y: 5, name: 'Mid BL' },
  { id: 15, x: 1, y: 3, name: 'Mid ML' },

  // Inner Square
  { id: 16, x: 2, y: 2, name: 'Inner TL' },
  { id: 17, x: 3, y: 2, name: 'Inner TM' },
  { id: 18, x: 4, y: 2, name: 'Inner TR' },
  { id: 19, x: 4, y: 3, name: 'Inner MR' },
  { id: 20, x: 4, y: 4, name: 'Inner BR' },
  { id: 21, x: 3, y: 4, name: 'Inner BM' },
  { id: 22, x: 2, y: 4, name: 'Inner BL' },
  { id: 23, x: 2, y: 3, name: 'Inner ML' },
];

/**
 * Standard orthogonal Mills (16 winning triples)
 */
export const STANDARD_MILLS = [
  // Outer square
  [0, 1, 2], [2, 3, 4], [4, 5, 6], [6, 7, 0],
  // Middle square
  [8, 9, 10], [10, 11, 12], [12, 13, 14], [14, 15, 8],
  // Inner square
  [16, 17, 18], [18, 19, 20], [20, 21, 22], [22, 23, 16],
  // Cross connections (midpoints)
  [1, 9, 17], [3, 11, 19], [5, 13, 21], [7, 15, 23]
];

/**
 * Diagonal Mills (Anthology variant: connects corners)
 */
export const DIAGONAL_MILLS = [
  [0, 8, 16],   // Top-Left
  [2, 10, 18],  // Top-Right
  [4, 12, 20],  // Bottom-Right
  [6, 14, 22],  // Bottom-Left
];

/**
 * Adjacency map for Standard (Orthogonal) rules
 */
export const ADJACENCY_STANDARD = {
  0: [1, 7],
  1: [0, 2, 9],
  2: [1, 3],
  3: [2, 4, 11],
  4: [3, 5],
  5: [4, 6, 13],
  6: [5, 7],
  7: [6, 0, 15],

  8: [9, 15],
  9: [8, 10, 1, 17],
  10: [9, 11],
  11: [10, 12, 3, 19],
  12: [11, 13],
  13: [12, 14, 5, 21],
  14: [13, 15, 6, 22],
  15: [14, 8, 7, 23],

  16: [17, 23],
  17: [16, 18, 9],
  18: [17, 19],
  19: [18, 20, 11],
  20: [19, 21],
  21: [20, 22, 13],
  22: [21, 23, 14],
  23: [22, 16, 15],
};

/**
 * Helper to get active mills and adjacency based on variant
 */
export function getBoardConfiguration(useDiagonals = false) {
  const mills = useDiagonals ? [...STANDARD_MILLS, ...DIAGONAL_MILLS] : [...STANDARD_MILLS];
  const adjacency = JSON.parse(JSON.stringify(ADJACENCY_STANDARD));

  if (useDiagonals) {
    // Add corner diagonal edges
    const cornerPairs = [
      [0, 8], [8, 16],
      [2, 10], [10, 18],
      [4, 12], [12, 20],
      [6, 14], [14, 22]
    ];
    for (const [u, v] of cornerPairs) {
      if (!adjacency[u].includes(v)) adjacency[u].push(v);
      if (!adjacency[v].includes(u)) adjacency[v].push(u);
    }
  }

  // Pre-calculate which mills pass through each point
  const millsByPoint = Array.from({ length: 24 }, () => []);
  mills.forEach((mill, index) => {
    for (const pt of mill) {
      millsByPoint[pt].push(mill);
    }
  });

  return { mills, adjacency, millsByPoint };
}

export const STRINGS = {
  en: {
    title: "Dahdi",
    subtitle: "Traditional Indian Mills Board Game",
    tagline: "Line up three, take one — the timeless mill game in an Indian dress.",
    phase1: "Phase 1: Placing Pieces",
    phase2: "Phase 2: Moving Pieces",
    phase3: "Phase 3: Flying! (Any point)",
    turnA: "Peacock Turn (Side A)",
    turnB: "Haldi Turn (Side B)",
    millFormed: "MILL FORMED! Tap an opponent piece to capture.",
    captured: "Piece captured!",
    cannotRemoveMillPiece: "Cannot remove a piece from a completed mill unless all enemy pieces are in mills.",
    mustSelectOwn: "Select one of your own pieces.",
    aiThinking: "AI is planning a move...",
    winA: "Peacock (Side A) Wins!",
    winB: "Haldi (Side B) Wins!",
    winDraw: "Draw / Stalemate!",
    rematch: "Play Again",
    newGame: "New Game",
    undo: "Undo",
    hint: "Hint",
    settings: "Settings",
    rules: "How to Play",
    easy: "Easy",
    medium: "Medium",
    hard: "Master",
    passAndPlay: "2-Player Pass & Play",
    vsAI: "Play vs AI",
    sidePeacock: "Peacock (Side A)",
    sideHaldi: "Haldi (Side B)",
  },
  hi: {
    title: "दाहदी",
    subtitle: "पारंपरिक भारतीय चर-भर खेल",
    tagline: "तीन जोड़ो, एक हटाओ — भारतीय धरोहर का कालजयी खेल।",
    phase1: "चरण १: गोटियाँ लगाना",
    phase2: "चरण २: गोटियाँ चलाना",
    phase3: "चरण ३: उड़ने का चरण (कहीं भी चलें)",
    turnA: "मयूर की बारी (पक्ष क)",
    turnB: "हल्दी की बारी (पक्ष ख)",
    millFormed: "दाहदी (तीन की कतार) बनी! विरोधी की गोटी हटाएं।",
    captured: "गोटी हटा दी गई!",
    cannotRemoveMillPiece: "कतार में सुरक्षित गोटी को नहीं हटाया जा सकता।",
    mustSelectOwn: "अपनी ही गोटी चुनें।",
    aiThinking: "दाव सोच रहा है...",
    winA: "मयूर (पक्ष क) विजयी!",
    winB: "हल्दी (पक्ष ख) विजयी!",
    winDraw: "खेल बराबरी पर समाप्त!",
    rematch: "पुनः खेलें",
    newGame: "नया खेल",
    undo: "पूर्ववत",
    hint: "संकेत",
    settings: "सेटिंग्स",
    rules: "खेल के नियम",
    easy: "सरल",
    medium: "मध्यम",
    hard: "कठिन",
    passAndPlay: "दो खिलाड़ी",
    vsAI: "कंप्यूटर से खेलें",
    sidePeacock: "मयूर (पक्ष क)",
    sideHaldi: "हल्दी (पक्ष ख)",
  },
  od: {
    title: "ଦାହଡ଼ି",
    subtitle: "ପାରମ୍ପରିକ ଭାରତୀୟ ବୋର୍ଡ ଖେଳ",
    tagline: "ତିନୋଟି ଯୋଡ଼, ଗୋଟିଏ ନିଅ — ଓଡ଼ିଶା ଓ ଭାରତର ପାରମ୍ପରିକ ଖେଳ।",
    phase1: "ପର୍ଯ୍ୟାୟ ୧: ଗୋଟି ସ୍ଥାପନ",
    phase2: "ପର୍ଯ୍ୟାୟ ୨: ଗୋଟି ଚାଳନା",
    phase3: "ପର୍ଯ୍ୟାୟ ୩: ଉଡ଼ାଣ ପର୍ଯ୍ୟାୟ",
    turnA: "ମୟୂର ପାଳି (ପକ୍ଷ କ)",
    turnB: "ହଳଦୀ ପାଳି (ପକ୍ଷ ଖ)",
    millFormed: "ଦାହଡ଼ି ହେଲା! ବିପକ୍ଷ ଗୋଟି ହଟାନ୍ତୁ।",
    captured: "ଗୋଟି ହଟାଗଲା!",
    cannotRemoveMillPiece: "ଦାହଡ଼ିରେ ଥିବା ଗୋଟି ହଟାଇ ପାରିବେ ନାହିଁ।",
    mustSelectOwn: "ଆପଣଙ୍କ ନିଜ ଗୋଟି ବାଛନ୍ତୁ।",
    aiThinking: "କମ୍ପ୍ୟୁଟର ଭାବୁଛି...",
    winA: "ମୟୂର (ପକ୍ଷ କ) ବିଜୟୀ!",
    winB: "ହଳଦୀ (ପକ୍ଷ ଖ) ବିଜୟୀ!",
    winDraw: "ଡ୍ର ହେଲା!",
    rematch: "ପୁନର୍ବାର ଖେଳନ୍ତୁ",
    newGame: "ନୂତନ ଖେଳ",
    undo: "ପୂର୍ବବତ୍",
    hint: "ସୂଚନା",
    settings: "ସେଟିଙ୍ଗ୍",
    rules: "ଖେଳ ନିୟମ",
    easy: "ସହଜ",
    medium: "ମଧ୍ୟମ",
    hard: "କଠିନ",
    passAndPlay: "୨ ଜଣ ଖେଳାଳି",
    vsAI: "AI ସହ ଖେଳନ୍ତୁ",
    sidePeacock: "ମୟୂର (ପକ୍ଷ କ)",
    sideHaldi: "ହଳଦୀ (ପକ୍ଷ ଖ)",
  }
};
