//-------------
//  Score handling
//-------------

const removedPiecesCountElement = document.getElementById('removed-pieces-count');
let removedPiecesCount = 0;

export function updateScore(matches, chain) {
  const numberOfPieces = matches.length;
  const scoreToAdd = (numberOfPieces ** 2) * (chain ** 4);
  removedPiecesCount += scoreToAdd;
  updateRemovedPiecesCountDisplay();
}

export function resetScore() {
  removedPiecesCount = 0;
  updateRemovedPiecesCountDisplay();
}

export function getScore() {
  return removedPiecesCount;
}

function updateRemovedPiecesCountDisplay() {
  const formattedRemovedPiecesCount = removedPiecesCount.toLocaleString();
  removedPiecesCountElement.textContent = formattedRemovedPiecesCount;
}


