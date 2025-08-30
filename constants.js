//-------------
//  Export
//-------------
export {ROWS, COLS, PIECE_SIZE, colors, FALL_START_DELAY_MS};

//-------------
// Constants
//-------------
const ROWS = 9;
const COLS = 9;
const PIECE_SIZE = 70;
const colors = ['red', 'blue', 'green', 'yellow', 'purple'];
const FALL_START_DELAY_MS = 100; // 演出ディレイ（落下開始直前）


// const colors = ['red', 'blue', 'green'];

// Expose to window for CSS sync in resize module (no bundler globals)
if (typeof window !== 'undefined') {
  window.__GAME_CONSTANTS__ = { ROWS, COLS, PIECE_SIZE };
}

