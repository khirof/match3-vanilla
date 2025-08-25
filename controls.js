//-------------
//  Controls: button, game start/over, and animation toggle
//-------------

import { isAnimating, setAnimating } from './state.js';
import { toggleAnimatedText, resetAnimatedText } from './animatedText.js';
import { toggleTimeBar, setOnTimeOver } from './timer.js';
import { resetOverlayAnimation, resetSpanAnimations, playOverlayAnimation, onOverlayClick } from './overlay.js';
import { initializePieces } from './pieceManagement.js';
import { changeWord } from './changeButtonWord.js';
import { resetScore } from './score.js';

export { toggleAnimatingStat, gameStart, gameOver };

const button = document.querySelector('button');
button.addEventListener('mousedown', () => {
  if (!isAnimating) {
    button.classList.add('clicked');
  }
});
button.addEventListener('mouseup', gameStart);

function toggleAnimatingStat(bool) {
  setAnimating(bool);
  toggleAnimatedText(bool);
  toggleTimeBar(!bool);
}

function gameStart() {
  if (!isAnimating) {
    button.classList.remove('clicked');
    resetOverlayAnimation();
    resetSpanAnimations();
    initializePieces();
    resetScore();
    changeWord();
    setTimeout(changeWord, 2000);
  }
}

function gameOver() {
  playOverlayAnimation();
}

onOverlayClick(gameStart);
setOnTimeOver(gameOver);


