//-------------
//  Highscore adapter wrapper
//  Provides a pluggable adapter interface. Default adapter uses localStorage.
//-------------

const MAX_ENTRIES = 20;

function safeSortAndSlice(arr) {
  // Normalize and sanitize entries, accept numeric strings from legacy data.
  const normalized = (Array.isArray(arr) ? arr : [])
    .map((entry) => {
      const rawName = entry && typeof entry.name === 'string' ? entry.name : '';
      const name = rawName.trim().slice(0, 20);
      const scoreNumber = Number(entry && entry.score);
      const createdAt = Number(entry && entry.createdAt) || 0;
      if (!name) return null;
      if (!Number.isFinite(scoreNumber) || scoreNumber < 0) return null;
      return { name, score: scoreNumber, createdAt };
    })
    .filter(Boolean);

  // Sort by score desc, then by createdAt desc for stable tiebreaker.
  return normalized
    .sort((a, b) => (b.score - a.score) || (b.createdAt - a.createdAt))
    .slice(0, MAX_ENTRIES);
}

// Default localStorage adapter
const localAdapter = (() => {
  const STORAGE_KEY = 'match3.highscores.v1';
  const NAME_KEY = 'match3.playerName';

  function readAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return safeSortAndSlice(parsed);
    } catch (_) {
      return [];
    }
  }

  function writeAll(entries) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
    } catch (_) {}
  }

  return {
    saveEntry(entry) {
      const now = Date.now();
      const safeName = (entry && typeof entry.name === 'string' ? entry.name : 'player').trim().slice(0, 20) || 'player';
      const safeScore = Math.max(0, Number(entry && entry.score) || 0);
      const newEntry = { name: safeName, score: safeScore, createdAt: now };
      const all = readAll();
      all.push(newEntry);
      const sorted = safeSortAndSlice(all);
      writeAll(sorted);
      try { localStorage.setItem(NAME_KEY, safeName); } catch (_) {}
      return newEntry;
    },
    getTop(limit = 10) {
      const all = readAll();
      return all.slice(0, Math.max(0, Math.min(limit, MAX_ENTRIES)));
    },
    getLastName() {
      try { return localStorage.getItem(NAME_KEY) || ''; } catch (_) { return ''; }
    },
    setLastName(name) {
      try { localStorage.setItem(NAME_KEY, (name || '').slice(0, 20)); } catch (_) {}
    },
    clearAllScores() {
      try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    }
  };
})();

let currentAdapter = localAdapter;

export function setAdapter(adapter) {
  if (!adapter) throw new Error('Adapter is required');
  const required = ['saveEntry','getTop','getLastName','setLastName','clearAllScores'];
  for (const fn of required) {
    if (typeof adapter[fn] !== 'function') throw new Error(`Adapter missing ${fn}`);
  }
  currentAdapter = adapter;
}

export function saveEntry(entry) { return currentAdapter.saveEntry(entry); }
export function getTop(limit = 10) { return currentAdapter.getTop(limit); }
export function getLastName() { return currentAdapter.getLastName(); }
export function setLastName(name) { return currentAdapter.setLastName(name); }
export function clearAllScores() { return currentAdapter.clearAllScores(); }


export function isHighScore(score, limit = 10) {
  const numericScore = Math.max(0, Number(score) || 0);
  if (numericScore <= 0) return false;
  const normalizedLimit = Math.max(0, Math.min(limit, MAX_ENTRIES));
  const currentTop = currentAdapter.getTop(normalizedLimit);
  if (currentTop.length < normalizedLimit) return true;
  const last = currentTop[currentTop.length - 1];
  const lastScore = last ? Number(last.score) || 0 : 0;
  return numericScore >= lastScore;
}

