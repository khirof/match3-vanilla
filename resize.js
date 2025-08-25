//-------------
//   Resize setup (side-effect module)
//-------------

function resizeGame() {
    const gameWidth = 720;
    const gameHeight = 950;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const scaleToFitX = windowWidth / gameWidth;
    const scaleToFitY = windowHeight / gameHeight;

    const currentScreenRatio = windowWidth / windowHeight;
    const optimalRatio = Math.min(scaleToFitX, scaleToFitY);

    if (currentScreenRatio >= 1.77 && currentScreenRatio <= 1.79) {
        document.body.style.zoom = optimalRatio;
    } else {
        document.body.style.zoom = Math.min(scaleToFitX, scaleToFitY);
    }
}

window.addEventListener('resize', resizeGame);
window.addEventListener('orientationchange', resizeGame);

// 初期ロード時にもリサイズを実行
window.addEventListener('load', resizeGame);


