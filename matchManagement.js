//-------------
//  import
//-------------
import { ROWS, COLS } from './constants.js';
import { pieces } from './pieceManagement.js';


//-------------
//  export
//-------------
export {
  getMatchingPieces
}


//-------------
//  Match
//-------------
function findMatches(row, col, rowDelta, colDelta) {
  const matches = [];
  const piece = pieces[row][col];
  if (!piece) return matches;
  while (true) {
    row += rowDelta;
    col += colDelta;
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) {
      break;
    }
    const nextPiece = pieces[row][col];
    if (nextPiece && piece && nextPiece.color === piece.color) {
      matches.push(nextPiece);
    } else {
      break;
    }
  }
  return matches;
}

function checkMatches(piece, matches, row, col, rowDelta, colDelta) {
  const findedMatches = [piece, ...findMatches(row, col, rowDelta, colDelta), ...findMatches(row, col, -1 * rowDelta, -1 * colDelta)];
  if (findedMatches.length >= 3) {
    matches.push(...findedMatches);
  }
  return matches;
}

function getMatchingPieces(piece) {
  if (!piece) return [];
  const [row, col] = piece.position;
  let matches = [];
  if (piece.specialType) {
    return [];
  }
  matches = checkMatches(piece, matches, row, col, 1, 0);
  matches = checkMatches(piece, matches, row, col, 0, 1);
  if (matches.length > 0) {
    const uniqueMatches = [...new Set(matches)];

    return uniqueMatches;
  }
  return [];
}

