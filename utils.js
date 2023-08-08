//-------------
//  import
//-------------
import { initializePieces } from './pieceManagement.js';
import { changeWord } from './changeButtonWord.js';


//-------------
//  export
//-------------
export {
  isAnimating,
  updateScore, 
  toggleAnimatingStat
}


//-------------
// Constants
//-------------
const removedPiecesCountElement = document.getElementById("removed-pieces-count");
let removedPiecesCount = 0;
let isAnimating = false;
const timeLimitSeconds = 10;
let intervalId;
let startTime;
let remainingTime = timeLimitSeconds;
const timeBar = document.getElementById('loading');


//-------------
//  Button
//-------------
const button = document.querySelector('button');
button.addEventListener('mousedown', () => {
  if (!isAnimating) {
    button.classList.add('clicked');
  }
});
button.addEventListener('mouseup', gameStart); // gameStart関数を呼び出す

//-------------
//  Score
//-------------
function updateScore(matches, chain) {
  const numberOfPieces = matches.length;
  const scoreToAdd = (numberOfPieces**2) * (chain ** 4);
  removedPiecesCount += scoreToAdd;
  updateRemovedPiecesCountDisplay();
}
function updateRemovedPiecesCountDisplay() {
  let formattedRemovedPiecesCount = removedPiecesCount.toLocaleString();
  removedPiecesCountElement.textContent = formattedRemovedPiecesCount;
}

//-------------
//AnimatedText
//-------------
function toggleAnimatedText(bool) {
  const animatedText = document.getElementById('animated-text');
  const liElements = animatedText.querySelectorAll('li');
  liElements.forEach(li => {
    if (bool) {
      li.style.animationPlayState = 'running';
    } else {
      resetAnimatedText()
    }
  });
}

function resetAnimatedText() {
  const animatedText = document.getElementById('animated-text');
  const liElements = animatedText.querySelectorAll('li');
  liElements.forEach(li => {
    li.style.animation = 'none';
    void li.offsetWidth;
    li.style.animation = null;
  });
}


//-------------
//  Control
//-------------
function toggleAnimatingStat(bool) {
  isAnimating = bool;
  toggleAnimatedText(bool);
  toggleTimeBar(!bool);
}

//-------------
//  Timer
//-------------
function toggleTimeBar(bool) {
  if (bool) {
    startCountdown();
  } else {
    stopCountdown();
  }
}

function startCountdown() {
  startTime = Date.now();
  intervalId = setInterval(updateCountdown, 1000);
  timeBar.style.animationDuration = `${timeLimitSeconds}s`;
  timeBar.style.animationPlayState = 'running';
}

// カウントダウンの更新とタイムオーバーの処理
function updateCountdown() {
  const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
  remainingTime = timeLimitSeconds - elapsedSeconds;
  if (remainingTime <= 0) {
     stopCountdown();
     gameOver();  //ここで、ボタン以外にマスクかけつつ、ゲームオーバー表示
  }
}

function stopCountdown() {
  clearInterval(intervalId);
  remainingTime = timeLimitSeconds;
  timeBar.style.animation = 'none';
  void timeBar.offsetWidth;
  timeBar.style.animation = null;
}


//-------------
//    game
//-------------
// ゲーム開始/再開の処理
function gameStart() {
  if (!isAnimating) {
    button.classList.remove('clicked');
    resetOverlayAnimation();
    resetSpanAnimations();
    initializePieces();
    removedPiecesCount = 0;
    updateRemovedPiecesCountDisplay();
    changeWord();
    setTimeout(changeWord, 2000);
  }
}

// ゲームオーバー時の処理
function gameOver() {
  playOverlayAnimation();
}

const overlay = document.getElementById("overlay");
const spanElements = document.querySelectorAll(".animate.four span");
const spanContainer = document.querySelector(".gameOverContainer");


function playSpanAnimations() {
  spanElements.forEach((span, index) => {
    setTimeout(() => {
      spanContainer.style.zIndex = 110;
      span.style.animationPlayState = "running";
    }, 100);
  });
}

function resetSpanAnimations() {
  spanElements.forEach((span) => {
    spanContainer.style.zIndex = -1;
    span.style.animationPlayState = "paused";
    span.style.animation = "none";
    void span.offsetWidth;
    span.style.animation = "";
  });
}

function playOverlayAnimation() {
  overlay.style.zIndex = 100;
  overlay.classList.add("fadeIn");
  overlay.addEventListener("animationend", () => {
    playSpanAnimations();
    overlay.style.pointerEvents = "all";
  });
}

function resetOverlayAnimation() {
  overlay.style.zIndex = -1;
  overlay.style.pointerEvents = "none";
  overlay.classList.remove("fadeIn");
  void overlay.offsetWidth;
}

overlay.addEventListener('click', gameStart); 
