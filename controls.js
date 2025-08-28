//-------------
//  Controls: button, game start/over, and animation toggle
//-------------

import { isInputLocked, setAnimating, setScene, AppScene } from './state.js';
import { toggleAnimatedText, resetAnimatedText } from './animatedText.js';
import { toggleTimeBar, setOnTimeOver } from './timer.js';
import { resetOverlayAnimation, resetSpanAnimations, playOverlayAnimation, setOverlayClickHandler, openOverlay, setOverlayContent, closeOverlay } from './overlay.js';
import { initializePieces, clearBoardInstant, ejectAllPiecesWithGravity } from './pieceManagement.js';
import { resetScore, getScore } from './score.js';
import { setWord } from './changeButtonWord.js';
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
  // Remove centered score if present
  const cs = document.getElementById('center-score');
  if (cs) cs.remove();
  setScene(AppScene.Playing);
  // Disable button interaction during play to prevent :active/hover visuals
  button.style.pointerEvents = 'none';
  button.classList.add('is-play-disabled');
  // Keep button visually pressed during play
  button.classList.add('clicked');
  resetOverlayAnimation();
  resetSpanAnimations();
  initializePieces();
  // Show PLAYING label during play
  try { setWord('playing'); } catch (e) {}
  toggleTimeBar(true);
}

async function gameOver() {
  // 1) No overlay: eject all pieces off-screen with gravity-like animation
  const ejectPromise = ejectAllPiecesWithGravity();
  // Show score earlier (half of current ejection duration ~2000ms)
  setTimeout(() => {
    try { showCenterScore(); } catch (e) {}
  }, 1000);
  await ejectPromise;

  // 2) Save high score automatically with a dummy name (no prompt)
  const currentScore = getScore();
  if (isHighScore(currentScore, 10)) {
    const name = 'ダミー';
    saveEntry({ name, score: currentScore });
  }

  // 3) Enable Start button
  button.style.pointerEvents = 'auto';
  button.classList.remove('is-play-disabled');
  button.classList.remove('clicked');
  // Switch label to restart and show again
  try { setWord('restart'); } catch (e) {}
  const textContainer2 = button.querySelector('.text');
  if (textContainer2) textContainer2.style.opacity = '1';
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
    closeOverlay();
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
    setOverlayClickHandler(() => closeOverlay());
  }
  openOverlay(Boolean(withGameOver));
}

// Static Menu button click handler
const menuButton = document.getElementById('menu-button');
if (menuButton) {
  menuButton.addEventListener('click', (ev) => {
    ev.stopPropagation();
    // Reuse Menu overlay
    try {
      renderMenuOverlay();
    } catch (_) {
      // fallback to leaderboard if menu is not available in this build
      try { renderLeaderboardOverlay(false); } catch (__) {}
    }
  });
}
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
  // Re-enable button for Title scene and ensure no stuck visual state
  button.classList.remove('clicked');
  button.style.pointerEvents = 'auto';
  button.classList.remove('is-play-disabled');
  resetScore();
}

function showCenterScore() {
  // Remove any previous score node
  const prev = document.getElementById('center-score');
  if (prev) prev.remove();
  const container = document.createElement('div');
  container.id = 'center-score';
  container.style.position = 'absolute';
  container.style.top = '50%';
  container.style.left = '50%';
  container.style.transform = 'translate(-50%, -50%) scale(0.8)';
  container.style.fontSize = '64px';
  container.style.fontWeight = '900';
  container.style.color = '#333';
  container.style.textShadow = '0 6px 16px rgba(0,0,0,0.2)';
  container.style.opacity = '0';
  container.style.transition = 'transform 600ms cubic-bezier(0.02, 0, 0.15, 1), opacity 600ms ease';
  const val = getScore();
  container.textContent = `${val.toLocaleString()}`;
  // Append after table to ensure visual stacking above board
  const root = document.body;
  root.appendChild(container);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      container.style.opacity = '1';
      container.style.transform = 'translate(-50%, -50%) scale(1)';
    });
  });
}


