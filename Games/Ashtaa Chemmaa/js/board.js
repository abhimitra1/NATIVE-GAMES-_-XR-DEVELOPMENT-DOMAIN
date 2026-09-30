/**
 * Ashtaa Chemmaa - Board Geometry & Coordinate System
 * 
 * Based on authentic Indian 5x5 board (Chauka Bara / Ashta Chamma)
 * and matching the exact BoardPath.cs logic from the Unity project:
 * - 5 rows (1 to 5, top to bottom), 5 columns (1 to 5, left to right)
 * - Safe cells: (1,3) Yellow, (3,5) Blue, (5,3) Green, (3,1) Red, (3,3) Center
 * - Base route (Green): 25 cells (progress 0..24)
 * - Red: rotated 1 turn clockwise
 * - Blue: rotated 3 turns clockwise
 * - Yellow: rotated 2 turns clockwise
 * - Green: rotated 0 turns clockwise
 */

const BoardGeometry = (() => {
  // Base route for the GREEN (Bottom) player (25 steps: 0 to 24)
  // Rows 1..5 (top to bottom), Cols 1..5 (left to right)
  const BASE_ROUTE_GREEN = [
    { r: 5, c: 3 }, // 0: Green Home (entry)
    { r: 5, c: 4 }, // 1
    { r: 5, c: 5 }, // 2: Bottom-right corner
    { r: 4, c: 5 }, // 3
    { r: 3, c: 5 }, // 4: Blue Home
    { r: 2, c: 5 }, // 5
    { r: 1, c: 5 }, // 6: Top-right corner
    { r: 1, c: 4 }, // 7
    { r: 1, c: 3 }, // 8: Yellow Home
    { r: 1, c: 2 }, // 9
    { r: 1, c: 1 }, // 10: Top-left corner
    { r: 2, c: 1 }, // 11
    { r: 3, c: 1 }, // 12: Red Home
    { r: 4, c: 1 }, // 13
    { r: 5, c: 1 }, // 14: Bottom-left corner
    { r: 5, c: 2 }, // 15: Last perimeter square before entering inner loop
    // Inner loop (clockwise spiral)
    { r: 4, c: 2 }, // 16: Enter inner ring
    { r: 3, c: 2 }, // 17
    { r: 2, c: 2 }, // 18: Inner top-left
    { r: 2, c: 3 }, // 19
    { r: 2, c: 4 }, // 20: Inner top-right
    { r: 3, c: 4 }, // 21
    { r: 4, c: 4 }, // 22: Inner bottom-right
    { r: 4, c: 3 }, // 23
    { r: 3, c: 3 }  // 24: Center Goal (Finish!)
  ];

  // Clockwise rotations of the base Green route:
  // 0: Red, 1: Blue, 2: Yellow, 3: Green
  const TURNS_CLOCKWISE = [1, 3, 2, 0];

  const SAFE_CELLS = [
    { r: 1, c: 3, label: 'Yellow Home' },
    { r: 3, c: 5, label: 'Blue Home' },
    { r: 5, c: 3, label: 'Green Home' },
    { r: 3, c: 1, label: 'Red Home' },
    { r: 3, c: 3, label: 'Center Goal' }
  ];

  const PLAYERS = [
    {
      id: 0,
      name: 'Red',
      side: 'West',
      color: '#e63946',
      accentColor: '#ff6b6b',
      glowColor: 'rgba(230, 57, 70, 0.6)',
      homeCell: { r: 3, c: 1 },
      homePouchAngle: 180, // Left
      avatar: '🔴'
    },
    {
      id: 1,
      name: 'Blue',
      side: 'East',
      color: '#2a6fdb',
      accentColor: '#4ea8de',
      glowColor: 'rgba(42, 111, 219, 0.6)',
      homeCell: { r: 3, c: 5 },
      homePouchAngle: 0, // Right
      avatar: '🔵'
    },
    {
      id: 2,
      name: 'Yellow',
      side: 'North',
      color: '#f4a261',
      accentColor: '#ffd166',
      glowColor: 'rgba(244, 162, 97, 0.6)',
      homeCell: { r: 1, c: 3 },
      homePouchAngle: 270, // Top
      avatar: '🟡'
    },
    {
      id: 3,
      name: 'Green',
      side: 'South',
      color: '#2a9d8f',
      accentColor: '#52b788',
      glowColor: 'rgba(42, 157, 143, 0.6)',
      homeCell: { r: 5, c: 3 },
      homePouchAngle: 90, // Bottom
      avatar: '🟢'
    }
  ];

  // Rotate a row/col around center (3,3) by `turns` 90-degree clockwise steps
  function rotateClockwise(cell, turns) {
    let x = cell.c - 3;
    let y = 3 - cell.r;

    turns = ((turns % 4) + 4) % 4;
    for (let i = 0; i < turns; i++) {
      const newX = y;
      const newY = -x;
      x = newX;
      y = newY;
    }

    const column = x + 3;
    const row = 3 - y;
    return { r: row, c: column };
  }

  // Precompute full 25-step paths for all 4 players
  const PLAYER_PATHS = [];
  for (let p = 0; p < 4; p++) {
    const path = [];
    const turns = TURNS_CLOCKWISE[p];
    for (let step = 0; step <= 24; step++) {
      path.push(rotateClockwise(BASE_ROUTE_GREEN[step], turns));
    }
    PLAYER_PATHS.push(path);
  }

  function getCell(playerIndex, progress) {
    if (progress < 0 || progress > 24) return null;
    return PLAYER_PATHS[playerIndex][progress];
  }

  function isSafeCell(r, c) {
    return SAFE_CELLS.some(sc => sc.r === r && sc.c === c);
  }

  function isCenterGoal(r, c) {
    return r === 3 && c === 3;
  }

  function isPlayerHomeCell(playerIndex, r, c) {
    const home = PLAYERS[playerIndex].homeCell;
    return home.r === r && home.c === c;
  }

  function getSafeCellInfo(r, c) {
    return SAFE_CELLS.find(sc => sc.r === r && sc.c === c) || null;
  }

  function isInnerTrack(progress) {
    return progress >= 16;
  }

  return {
    GRID_SIZE: 5,
    FINISH_PROGRESS: 24,
    START_PROGRESS: 0,
    ENTRY_PROGRESS: 0,
    PLAYERS,
    PLAYER_PATHS,
    SAFE_CELLS,
    getCell,
    isSafeCell,
    isCenterGoal,
    isPlayerHomeCell,
    getSafeCellInfo,
    isInnerTrack,
    rotateClockwise
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = BoardGeometry;
}
