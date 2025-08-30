//-------------
//   Resize setup (side-effect module)
//-------------

function resizeGame() {
    // Logical game canvas size (board + HUD design space)
    const designWidth = 720;
    const designHeight = 1280;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const scaleToFitX = windowWidth / designWidth;
    const scaleToFitY = windowHeight / designHeight;

    const scale = Math.min(scaleToFitX, scaleToFitY);

    // Apply scale via CSS variables
    document.documentElement.style.setProperty('--board-scale', String(scale));

    // Sync board size and cell size to constants (ROWS, COLS, PIECE_SIZE)
    try {
        // Lazy import to avoid circular deps
        const { ROWS, COLS, PIECE_SIZE } = (window.__GAME_CONSTANTS__ || {});
        if (typeof ROWS === 'number' && typeof COLS === 'number' && typeof PIECE_SIZE === 'number') {
            const innerPadding = Math.max(12, Math.round(PIECE_SIZE * 0.2));
            const boardWidth = (COLS * PIECE_SIZE + innerPadding * 2) + 'px';
            const boardHeight = (ROWS * PIECE_SIZE + innerPadding * 2) + 'px';
            document.documentElement.style.setProperty('--piece-size', PIECE_SIZE + 'px');
            document.documentElement.style.setProperty('--board-width', boardWidth);
            document.documentElement.style.setProperty('--board-height', boardHeight);
            document.documentElement.style.setProperty('--board-inner-padding', innerPadding + 'px');
        }
    } catch (_) {}
}

window.addEventListener('resize', resizeGame);
window.addEventListener('orientationchange', resizeGame);

// Initialize once DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', resizeGame);
} else {
    resizeGame();
}

// 初期ロード時にもリサイズを実行
window.addEventListener('load', resizeGame);


