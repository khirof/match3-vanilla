//-------------
//  import
//-------------
import { getElement } from "./domManipulation.js";
import { isAnimating } from './utils.js';
import { pieces, removePieces } from './pieceManagement.js';
import { ROWS, COLS, PIECE_SIZE } from "./constants.js";
import { getMatchingPieces } from "./matchManagement.js";
import { applySpecialPieceRules, applySpecialMix } from "./specialManagement.js";


//-------------
//  export
//-------------
export {
  handleDrop,
  handleDrag
};


//-------------
//  DragDrop
//-------------
function resetDragAttributes(target) {
  target.style.transform = 'translate(0px, 0px)';
  ['data-x', 'data-y', 'data-start-x', 'data-start-y'].forEach(attr => target.removeAttribute(attr));
}

function getNewPosition(td, dx, dy) {
  const col = td.cellIndex;
  const row = td.parentElement.rowIndex;
  const newRow = row + Math.round(dy / PIECE_SIZE);
  const newCol = col + Math.round(dx / PIECE_SIZE);
  return { row, col, newRow, newCol };
}

function getMoveDistance(event, target) {
  const startClientX = parseFloat(target.getAttribute('data-start-x') || 0);
  const startClientY = parseFloat(target.getAttribute('data-start-y') || 0);
  const moveDistanceX = Math.abs(event.clientX - startClientX);
  const moveDistanceY = Math.abs(event.clientY - startClientY);
  return { moveDistanceX, moveDistanceY };
}

function handleDrop(event) {
  const target = event.target;
  const td = target.parentElement;
  const dx = parseFloat(target.getAttribute('data-x') || 0);
  const dy = parseFloat(target.getAttribute('data-y') || 0);
  const { row, col, newRow, newCol } = getNewPosition(td, dx, dy);
  const { moveDistanceX, moveDistanceY } = getMoveDistance(event, target);
  if (moveDistanceX >= PIECE_SIZE || moveDistanceY >= PIECE_SIZE) {
    const piece = pieces[row][col];
    handleDrag(piece, newRow, newCol, row, col);
  }
  resetDragAttributes(target);
}

function handleDrag(piece, newRow, newCol, oldRow, oldCol) {
  if (isAnimating) return;
  if (newRow < 0 || newRow >= ROWS || newCol < 0 || newCol >= COLS) {
    return;
  }
  const newPiece = pieces[newRow][newCol];
  if (!isAdjacent(piece, newPiece)) {
    return;
  }
  swapPieces(piece, newPiece);
  const pieceMatches = getMatchingPieces(piece);
  const newPieceMatches = getMatchingPieces(newPiece);
  let combinedMatches = [];
  if (pieceMatches.length > 0 || newPieceMatches.length > 0 || piece.specialType || newPiece.specialType) {
      animateSwap(piece, newPiece, () => {
        if (piece.specialType && newPiece.specialType) {  //起点座標はdrag先=piece(swap済なので)
          applySpecialMix(piece, newPiece);
        }
        combinedMatches = applySpecialPieceRules([pieceMatches, newPieceMatches], [piece, newPiece]);
        [piece, newPiece].forEach((p) => {
          if (p.specialType) {
            combinedMatches.push(p);
          }
        });
        removePieces(combinedMatches);
      });
  } else {
    swapPieces(piece, newPiece);
  }
}

//-------------
//  Swap
//-------------
function swapPieces(piece1, piece2) {
  const [row1, col1] = piece1.position;
  const [row2, col2] = piece2.position;
  piece1.position = [row2, col2];
  piece2.position = [row1, col1];
  pieces[row1][col1] = piece2;
  pieces[row2][col2] = piece1;
}

function isAdjacent(piece1, piece2) {
  const [row1, col1] = piece1.position;
  const [row2, col2] = piece2.position;
  return (
    (Math.abs(row1 - row2) === 1 && col1 === col2) ||
    (Math.abs(col1 - col2) === 1 && row1 === row2)
  );
}

function setTransitionAndTransform(element, transition, transform, opacity) {
  element.style.transition = transition;
  element.style.transform = transform;
  if (opacity !== undefined) {
    element.style.opacity = opacity;
  }
}


function swapNodes(node1, node2) {
  const parent1 = node1.parentNode;
  const parent2 = node2.parentNode;
  parent1.removeChild(node1);
  parent2.removeChild(node2);
  parent1.appendChild(node2);
  parent2.appendChild(node1);
}

function animateSwap(piece1, piece2, onComplete) {
  const [row1, col1] = piece1.position;
  const [row2, col2] = piece2.position;
  const div1 = getElement(row1, col1);
  const div2 = getElement(row2, col2);

  setTransitionAndTransform(div1, 'transform 0.3s', '');
  setTransitionAndTransform(div2, 'transform 0.3s', '');
  setTimeout(() => {
    if (piece1.specialType && piece2.specialType) {   //Mixの場合。元に戻さず不透明化（消えたように見せる）
      setTransitionAndTransform(div1, 'opacity 0.3s', `translate(0, 0)`, 0);
    } else {
      setTransitionAndTransform(div1, 'transform 0.3s', `translate(${(col2 - col1) * PIECE_SIZE}px, ${(row2 - row1) * PIECE_SIZE}px)`);
    }
    setTransitionAndTransform(div2, 'transform 0.3s', `translate(${(col1 - col2) * PIECE_SIZE}px, ${(row1 - row2) * PIECE_SIZE}px)`);
  }, 0);
  setTimeout(() => {
    swapNodes(div1, div2);
    setTransitionAndTransform(div1, '', '');
    setTransitionAndTransform(div2, '', '');
    onComplete();
  }, 300);
}


