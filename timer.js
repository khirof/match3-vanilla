//-------------
// Timer control: circular countdown, JS-driven, counts only user interaction time
//-------------

import { canInteract } from './state.js';

const TIME_LIMIT_MS = 20_000; // 20 seconds
let onTimeOverCallback = null;

// Accumulator for active (interactable) time
let totalActiveMs = 0;
let rafId = 0;
let lastTickMs = 0;
let running = false;
const DEBUG_TIMER = false;
function tlog() {}

// Cached DOM
let circleEl = null; // no longer used; kept for compatibility
let labelEl = null;
let wedgeEl = null; // .ct-fill element controlling conic wedge
let didLogDom = false;
let lastLoggedSecond = -1;
let circumference = 339.292; // replaced at runtime via getTotalLength()
let isRecovering = false;

function ensureDomCache() {
  if (!circleEl) circleEl = null;
  if (!labelEl) labelEl = document.getElementById('ct-seconds');
  if (!wedgeEl) wedgeEl = document.querySelector('#circular-timer .ct-fill');
  // no SVG setup needed

  if (!didLogDom) {
    const shell = document.getElementById('circular-timer');
    const cs = shell ? getComputedStyle(shell) : null;
    tlog('ensureDomCache:', { shellExists: Boolean(shell), wedgeExists: Boolean(wedgeEl), timerSize: cs ? cs.width + ' x ' + cs.height : 'n/a' });
    didLogDom = true;
  }
}

export function setOnTimeOver(callback) {
  onTimeOverCallback = callback;
}

export function resetTimer() {
  totalActiveMs = 0;
  lastTickMs = 0;
  ensureDomCache();
  if (wedgeEl) wedgeEl.style.setProperty('--deg', '0deg');
  if (labelEl) labelEl.textContent = '0';
  lastLoggedSecond = -1;
  tlog('resetTimer: remaining=0ms (idle visuals)');
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
  // Update numeric label and ring stroke
  if (labelEl) {
    const secs = Math.ceil(remainingMs / 1000);
    labelEl.textContent = `${secs}`;
    if (secs !== lastLoggedSecond) {
      lastLoggedSecond = secs;
      tlog('updateVisuals: secs=', secs, 'remainingMs=', remainingMs);
    }
  }
  if (!isRecovering && wedgeEl) {
    const remainingRatio = Math.max(0, Math.min(1, remainingMs / TIME_LIMIT_MS));
    const filledRatio = 1 - remainingRatio; // grow as time decreases
    const deg = Math.round(filledRatio * 360);
    wedgeEl.style.setProperty('--deg', deg + 'deg');
  }
}

// Public helpers to control water recovery/drain animations
export function instantEmpty() {
  ensureDomCache();
  if (wedgeEl) wedgeEl.style.setProperty('--deg', '0deg');
  if (labelEl) labelEl.textContent = '0';
  tlog('instantEmpty');
}

export function animateFillToFull(durationMs = 1000) {
  ensureDomCache();
  isRecovering = true;
  const start = performance.now();
  const beginDeg = (() => {
    if (wedgeEl) {
      const v = parseFloat((wedgeEl.style.getPropertyValue('--deg') || '0deg')) || 0;
      return isNaN(v) ? 0 : v;
    }
    return 0;
  })();
  tlog('animateFillToFull: begin deg', beginDeg, 'duration', durationMs, 'ms');
  return new Promise((resolve) => {
    const loop = (now) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const deg = beginDeg + (360 - beginDeg) * eased;
      if (wedgeEl) wedgeEl.style.setProperty('--deg', deg + 'deg');
      const limitSec = Math.round(TIME_LIMIT_MS / 1000);
      if (labelEl) labelEl.textContent = `${Math.ceil(t * limitSec)}`;
      if (t < 1) {
        requestAnimationFrame(loop);
      } else {
        isRecovering = false;
        tlog('animateFillToFull: complete, deg=360');
        resolve();
      }
    };
    requestAnimationFrame(loop);
  });
}


