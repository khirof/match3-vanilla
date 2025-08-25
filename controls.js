//-------------
//  Controls: button, game start/over, and animation toggle
//-------------

import { isInputLocked, setAnimating } from './state.js';
import { toggleAnimatedText, resetAnimatedText } from './animatedText.js';
import { toggleTimeBar, setOnTimeOver } from './timer.js';
import { resetOverlayAnimation, resetSpanAnimations, playOverlayAnimation, setOverlayClickHandler, openOverlay, setOverlayContent, closeOverlay } from './overlay.js';
import { initializePieces } from './pieceManagement.js';
import { changeWord } from './changeButtonWord.js';
import { resetScore, getScore } from './score.js';
import { saveEntry, getTop, getLastName, clearAllScores, isHighScore } from './highscore.js';

export { toggleAnimatingStat, gameStart, gameOver };

const button = document.querySelector('button');
button.addEventListener('mousedown', () => {
  if (!isInputLocked()) {
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
  if (!isInputLocked()) {
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
  // Save score flow
  const currentScore = getScore();
  if (isHighScore(currentScore, 10)) {
    const last = getLastName();
    const name = prompt('Enter your name for the leaderboard:', last || '');
    if (name !== null) {
      const trimmed = name.trim().slice(0, 20);
      if (trimmed) {
        saveEntry({ name: trimmed, score: currentScore });
      }
    }
  }
  // Show overlay with leaderboard
  renderLeaderboardOverlay(true);
}

setOverlayClickHandler(gameStart);
setOnTimeOver(gameOver);

function renderLeaderboardOverlay(withGameOver) {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '50%';
  container.style.left = '50%';
  container.style.transform = 'translate(-50%, -50%)';
  container.style.background = 'rgba(255,255,255,0.9)';
  container.style.borderRadius = '12px';
  container.style.padding = '20px 24px';
  container.style.width = '320px';
  container.style.maxHeight = '70vh';
  container.style.overflow = 'auto';
  container.style.boxShadow = '0 10px 30px rgba(0,0,0,0.35)';

  const title = document.createElement('div');
  title.textContent = 'Leaderboard';
  title.style.fontWeight = 'bold';
  title.style.fontSize = '20px';
  title.style.marginBottom = '12px';
  title.style.textAlign = 'center';
  container.appendChild(title);

  const list = document.createElement('ol');
  list.style.margin = '0';
  list.style.paddingLeft = '20px';
  const entries = getTop(10);
  if (!entries.length) {
    const empty = document.createElement('div');
    empty.textContent = 'No scores yet';
    empty.style.textAlign = 'center';
    empty.style.opacity = '0.8';
    container.appendChild(empty);
  } else {
    entries.forEach((e) => {
      const li = document.createElement('li');
      li.textContent = `${e.name} - ${e.score.toLocaleString()}`;
      li.style.marginBottom = '6px';
      list.appendChild(li);
    });
    container.appendChild(list);
  }

  const buttons = document.createElement('div');
  buttons.style.display = 'flex';
  buttons.style.gap = '8px';
  buttons.style.marginTop = '16px';
  buttons.style.justifyContent = 'center';

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    closeOverlay();
  });
  buttons.appendChild(closeBtn);

  const restartBtn = document.createElement('button');
  restartBtn.textContent = 'Restart';
  restartBtn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    closeOverlay();
    gameStart();
  });
  buttons.appendChild(restartBtn);

  const clearBtn = document.createElement('button');
  clearBtn.textContent = 'Clear Scores';
  clearBtn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    const ok = confirm('Clear all saved scores?');
    if (ok) {
      clearAllScores();
      // Re-render overlay content to reflect cleared list
      setOverlayContent(document.createTextNode('Scores cleared.'));
      setTimeout(() => {
        closeOverlay();
        renderLeaderboardOverlay(false);
      }, 600);
    }
  });
  buttons.appendChild(clearBtn);

  container.appendChild(buttons);

  setOverlayContent(container);
  if (withGameOver) {
    setOverlayClickHandler(gameStart);
  } else {
    setOverlayClickHandler(() => closeOverlay());
  }
  openOverlay(Boolean(withGameOver));
}

// Floating button to open leaderboard anytime
const trophyBtn = document.createElement('button');
trophyBtn.textContent = '🏆';
trophyBtn.title = 'Leaderboard';
trophyBtn.style.position = 'fixed';
trophyBtn.style.right = '16px';
trophyBtn.style.bottom = '16px';
trophyBtn.style.borderRadius = '50%';
trophyBtn.style.width = '48px';
trophyBtn.style.height = '48px';
trophyBtn.style.fontSize = '20px';
trophyBtn.style.boxShadow = '0 6px 16px rgba(0,0,0,0.25)';
trophyBtn.style.border = 'none';
trophyBtn.style.cursor = 'pointer';
document.body.appendChild(trophyBtn);
trophyBtn.addEventListener('click', (ev) => {
  ev.stopPropagation();
  renderLeaderboardOverlay(false);
});


