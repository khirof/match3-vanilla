//-------------
// Timer control and time bar animation
//-------------

const timeLimitSeconds = 10;
let intervalId;
let startTime;
let onTimeOverCallback = null;

function getTimeBar() {
  return document.getElementById('loading');
}

export function setOnTimeOver(callback) {
  onTimeOverCallback = callback;
}

export function toggleTimeBar(shouldStart) {
  if (shouldStart) {
    startCountdown();
  } else {
    stopCountdown();
  }
}

function startCountdown() {
  const timeBar = getTimeBar();
  startTime = Date.now();
  clearInterval(intervalId);
  intervalId = setInterval(updateCountdown, 1000);
  if (timeBar) {
    timeBar.style.animationDuration = `${timeLimitSeconds}s`;
    timeBar.style.animationPlayState = 'running';
  }
}

function updateCountdown() {
  const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
  const remainingTime = timeLimitSeconds - elapsedSeconds;
  if (remainingTime <= 0) {
     stopCountdown();
     if (typeof onTimeOverCallback === 'function') {
       onTimeOverCallback();
     }
  }
}

function stopCountdown() {
  const timeBar = getTimeBar();
  clearInterval(intervalId);
  if (timeBar) {
    timeBar.style.animation = 'none';
    void timeBar.offsetWidth;
    timeBar.style.animation = null;
  }
}


