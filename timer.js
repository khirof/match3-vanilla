//-------------
// Timer control: circular countdown, JS-driven, counts only user interaction time
//-------------

import { canInteract } from './state.js';

const TIME_LIMIT_MS = 60_000; // 60 seconds
let onTimeOverCallback = null;

// Accumulator for active (interactable) time
let totalActiveMs = 0;
let rafId = 0;
let lastTickMs = 0;
let running = false;
const DEBUG_TIMER = false;
function tlog() {}

// Cached DOM
let circleEl = null; // legacy SVG circle if present
let labelEl = null;
let waterEl = null;
let didLogDom = false;
let lastLoggedSecond = -1;
let circumference = 339.292; // replaced at runtime via getTotalLength()
let isRecovering = false;

function ensureDomCache() {
  if (!circleEl) circleEl = document.querySelector('#circular-timer .ct-progress');
  if (!labelEl) labelEl = document.getElementById('ct-seconds');
  if (!waterEl) waterEl = document.querySelector('#circular-timer .ct-water');
  if (circleEl && typeof circleEl.getTotalLength === 'function') {
    try {
      circumference = circleEl.getTotalLength();
      circleEl.style.strokeDasharray = `${circumference}`;
      circleEl.style.strokeDashoffset = `${circumference}`;
    } catch (_) {}
  }

  if (!didLogDom) {
    const shell = document.getElementById('circular-timer');
    const fill = document.querySelector('#circular-timer .ct-fill');
    const shellBox = shell ? shell.getBoundingClientRect() : null;
    const fillBox = fill ? fill.getBoundingClientRect() : null;
    const waterBox = waterEl ? waterEl.getBoundingClientRect() : null;
    const cs = shell ? getComputedStyle(shell) : null;
    tlog('ensureDomCache:', {
      shellExists: Boolean(shell),
      fillExists: Boolean(fill),
      waterExists: Boolean(waterEl),
      shellBox,
      fillBox,
      waterBox,
      timerSize: cs ? cs.width + ' x ' + cs.height : 'n/a'
    });
    if (!waterEl) console.warn('[TIMER] .ct-water not found');
    didLogDom = true;
  }
}

export function setOnTimeOver(callback) {
  onTimeOverCallback = callback;
}

export function resetTimer() {
  totalActiveMs = 0;
  lastTickMs = 0;
  updateVisuals(TIME_LIMIT_MS);
  tlog('resetTimer: remaining=60000ms');
}

export function toggleTimeBar(shouldStart) {
  ensureDomCache();
  if (shouldStart) {
    if (!running) {
      running = true;
      lastTickMs = performance.now();
      rafId = requestAnimationFrame(tick);
      tlog('toggleTimeBar: START');
    }
  } else {
    if (running) {
      running = false;
      cancelAnimationFrame(rafId);
      rafId = 0;
      tlog('toggleTimeBar: STOP');
    }
  }
}

function tick(nowMs) {
  if (!running) return;
  const delta = Math.max(0, nowMs - lastTickMs);
  lastTickMs = nowMs;

  if (canInteract()) {
    totalActiveMs += delta;
  }

  const remainingMs = Math.max(0, TIME_LIMIT_MS - totalActiveMs);
  updateVisuals(remainingMs);

  if (remainingMs <= 0) {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    tlog('time over');
    if (typeof onTimeOverCallback === 'function') onTimeOverCallback();
    return;
  }

  rafId = requestAnimationFrame(tick);
}

function updateVisuals(remainingMs) {
  ensureDomCache();
  // Update numeric label and water height
  if (labelEl) {
    const secs = Math.ceil(remainingMs / 1000);
    labelEl.textContent = `${secs}`;
    if (secs !== lastLoggedSecond) {
      lastLoggedSecond = secs;
      tlog('updateVisuals: secs=', secs, 'remainingMs=', remainingMs);
    }
  }
  if (!isRecovering && waterEl) {
    const fillPerc = (remainingMs / TIME_LIMIT_MS);
    const heightPerc = Math.max(0, Math.min(100, Math.round(fillPerc * 100)));
    waterEl.style.height = `${heightPerc}%`;
    if (lastLoggedSecond >= 0) tlog('water height ->', waterEl.style.height);
  }
}

// Public helpers to control water recovery/drain animations
export function instantEmpty() {
  ensureDomCache();
  if (waterEl) waterEl.style.height = '0%';
  if (labelEl) labelEl.textContent = '0';
  tlog('instantEmpty');
}

export function animateFillToFull(durationMs = 1000) {
  ensureDomCache();
  isRecovering = true;
  const start = performance.now();
  const beginHeight = (() => {
    const h = waterEl ? parseFloat(waterEl.style.height || '0') : 0;
    return isNaN(h) ? 0 : h;
  })();
  tlog('animateFillToFull: begin at', beginHeight + '%', 'duration', durationMs, 'ms');
  return new Promise((resolve) => {
    const loop = (now) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const h = beginHeight + (100 - beginHeight) * eased;
      if (waterEl) waterEl.style.height = `${h}%`;
      if (labelEl) labelEl.textContent = `${Math.ceil(t * 60)}`;
      if (t < 1) {
        requestAnimationFrame(loop);
      } else {
        isRecovering = false;
        tlog('animateFillToFull: complete at 100%');
        resolve();
      }
    };
    requestAnimationFrame(loop);
  });
}


