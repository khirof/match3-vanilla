//-------------
//   Resize setup (side-effect module)
//-------------

function resizeGame() {
    // Logical game canvas size (board + HUD design space)
    const designWidth = 720;
    const designHeight = 1200;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const scaleToFitX = windowWidth / designWidth;
    const scaleToFitY = windowHeight / designHeight;

    const scale = Math.min(scaleToFitX, scaleToFitY);

    // Apply scale via CSS variable; used by #board transform
    document.documentElement.style.setProperty('--board-scale', String(scale));
}

window.addEventListener('resize', resizeGame);
window.addEventListener('orientationchange', resizeGame);

// 初期ロード時にもリサイズを実行
window.addEventListener('load', resizeGame);


