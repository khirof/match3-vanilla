//-------------
//  Controls: button, game start/over, and animation toggle
//-------------

import { isInputLocked, setAnimating, setScene, AppScene } from './state.js';
import { toggleAnimatedText, resetAnimatedText } from './animatedText.js';
import { toggleTimeBar, setOnTimeOver } from './timer.js';
import { resetOverlayAnimation, resetSpanAnimations, playOverlayAnimation, setOverlayClickHandler, openOverlay, setOverlayContent, closeOverlay } from './overlay.js';
import { initializePieces, clearBoardInstant } from './pieceManagement.js';
import { changeWord } from './changeButtonWord.js';
import { resetScore, getScore } from './score.js';
import { saveEntry, getTop, getLastName, clearAllScores, isHighScore } from './highscore.js';

export { toggleAnimatingStat, gameStart, gameOver };

const button = document.querySelector('button');
button.addEventListener('mousedown', () => {
  // Animate only when board is blank (Title)
  if (document.querySelectorAll('#table .piece').length === 0) {
    button.classList.add('clicked');
  }
});
button.addEventListener('mouseup', () => {
  // Start only allowed on Title scene (blank board)
  if (document.querySelectorAll('#table .piece').length === 0) {
    gameStart();
  } else {
    // ignore if board is not blank (already playing or game over cleanup not finished)
  }
});

function toggleAnimatingStat(bool) {
  setAnimating(bool);
  toggleAnimatedText(bool);
  toggleTimeBar(!bool);
}

function gameStart() {
  // Allow starting from Title regardless of current input lock
  button.classList.remove('clicked');
  setScene(AppScene.Playing);
  // Disable button interaction during play to prevent :active/hover visuals
  button.style.pointerEvents = 'none';
  resetOverlayAnimation();
  resetSpanAnimations();
  initializePieces();
  changeWord();
  setTimeout(changeWord, 2000);
  toggleTimeBar(true);
}

async function gameOver() {
  // 1) Show Game Over overlay and play animation first
  setOverlayClickHandler(() => {});
  openOverlay(true);
  await waitForGameOverAnimationEnd();

  // 2) Then handle high score prompt (if any)
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

  // 3) Clear game over text right before leaderboard, then show leaderboard
  resetSpanAnimations();
  renderLeaderboardOverlay(false);
  // Overlays close → return to Title/blank
  setOverlayClickHandler(returnToTitle);
}

setOverlayClickHandler(gameStart);
setOnTimeOver(gameOver);

function renderLeaderboardOverlay(withGameOver) {
  const container = document.createElement('div');
  container.className = 'leaderboard-modal';
  // Prevent clicks inside modal from bubbling to overlay
  container.addEventListener('click', (ev) => ev.stopPropagation());

  const title = document.createElement('div');
  title.textContent = 'Leaderboard';
  title.className = 'leaderboard-title';
  container.appendChild(title);

  const list = document.createElement('ol');
  list.className = 'leaderboard-list';
  const entries = getTop(10);
  if (!entries.length) {
    const empty = document.createElement('div');
    empty.textContent = 'No scores yet';
    empty.className = 'leaderboard-empty';
    container.appendChild(empty);
  } else {
    entries.forEach((e) => {
      const li = document.createElement('li');
      const nameSpan = document.createElement('span');
      nameSpan.className = 'leaderboard-name';
      nameSpan.textContent = e.name;
      const scoreSpan = document.createElement('span');
      scoreSpan.className = 'leaderboard-score';
      scoreSpan.textContent = e.score.toLocaleString();
      li.appendChild(nameSpan);
      li.appendChild(scoreSpan);
      list.appendChild(li);
    });
    container.appendChild(list);
  }

  const buttons = document.createElement('div');
  buttons.className = 'leaderboard-buttons';

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.className = 'leaderboard-button';
  closeBtn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    returnToTitle();
  });
  buttons.appendChild(closeBtn);

  // Restart button removed (single start button policy)

  const clearBtn = document.createElement('button');
  clearBtn.textContent = 'Clear Scores';
  clearBtn.className = 'leaderboard-button leaderboard-button--danger';
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
    setOverlayClickHandler(() => {});
  } else {
    setOverlayClickHandler(returnToTitle);
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
//-------------
//  Helpers for Game Over sequencing
//-------------
async function waitForGameOverAnimationEnd() {
  const spans = Array.from(document.querySelectorAll('.animate.four span'));
  if (!spans.length) return;
  await Promise.all(spans.map((span) => new Promise((resolve) => {
    const handler = () => { span.removeEventListener('animationend', handler); resolve(); };
    span.addEventListener('animationend', handler, { once: true });
  })));
}

async function returnToTitle() {
  // Instant clear; initial animation will play on next start
  try { clearBoardInstant(); } catch (e) {}
  toggleTimeBar(false);
  setScene(AppScene.Title);
  closeOverlay();
  // Re-enable button for Title scene and ensure no stuck visual state
  button.classList.remove('clicked');
  button.style.pointerEvents = 'auto';
  resetScore();
}


