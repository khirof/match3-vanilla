//-------------
//  Simple localStorage-based persistence
//-------------

const STORAGE_KEY = 'match3:gameState';

export function saveGameState(snapshot) {
  try {
    const data = JSON.stringify(snapshot);
    window.localStorage.setItem(STORAGE_KEY, data);
  } catch (e) {
    // ignore persistence errors
  }
}

export function loadGameState() {
  try {
    const data = window.localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

export function clearGameState() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // ignore
  }
}


