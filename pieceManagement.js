//-------------
//  import
//-------------
import { ROWS, COLS, colors, PIECE_SIZE } from "./constants.js";
import { addPieceToDOM, clearInnerHTML, createDiv, getElement } from "./domManipulation.js";
import { applySpecialEffect, applySpecialPieceRules, initializeSpecialPieces, addSpecialClass } from "./specialManagement.js";
import { getMatchingPieces } from "./matchManagement.js";
import { toggleAnimatingStat, updateScore } from "./utils.js";
import { addDraggableEvents } from "./eventHandlers.js";


//-------------
//  export
//-------------
export {
  pieces,
  addPiece,
  removePieces,
  initializePieces
}


//-------------
//  variables
//-------------
const pieces = [];
let chainCount = 1;


//-------------
//    Add
//-------------
function addPiece(pieces, row, col) {
  const color = colors[Math.floor(Math.random() * colors.length)];
  const piece = {
    color,
    position: [row, col],
  };
  pieces[row][col] = piece;
  addPieceToDOM(piece);
}


//-------------
//  Remove
//-------------
async function removePieces(matches) {
  toggleAnimatingStat(true);
  updateScore(matches, chainCount);

  const specialPieces = matches.filter((piece) => piece.specialType);
  const nonSpecialPieces = matches.filter((piece) => !piece.specialType);
  const allAffectedPieces = await applySpecialEffect(specialPieces, specialPieces, nonSpecialPieces, true);   //初回特殊ピースの2重処理を避けるため、最初の特殊ピースは処理済(影響範囲考慮済)で渡す。
  const uniqueAffectedPieces = [...new Set(allAffectedPieces.concat(nonSpecialPieces))] ; 

    uniqueAffectedPieces.forEach((piece) => {
      const [row, col] = piece.position;
      if (pieces[row]) {
        pieces[row][col] = null;
        clearInnerHTML(row, col)
      }
    });
    moveAndRefill();
}


//-------------
//  Move
//-------------
function removeAndRefillMatches() {
  chainCount++;
  //マッチ有無チェック。あれば格納
  const allMatches = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const piece = pieces[row][col];
      const matchingPieces = getMatchingPieces(piece);
      if (matchingPieces.length > 0) {
        allMatches.push(matchingPieces);
      }
    }
  }
  
  //削除対象セット
  let piecesToRemove = [];
  if (allMatches.length > 0) {  //マッチ有なら特殊ピース生成して削除処理に進む
    piecesToRemove = applySpecialPieceRules(allMatches);
  } else {  //マッチがない場合のみ、待機中ピースを起動(waitingBomb系)
    piecesToRemove = findSpecialPiece(['waitingBomb', 'waitingDoubleBomb']);
  }

  //削除対象があれば次のループへ。なければ削除再帰終了。
  if (piecesToRemove.length > 0) {
    removePieces(piecesToRemove);
  } else {  //ここがピース削除連鎖の再帰処理ラスト。
    toggleAnimatingStat(false);
    chainCount = 1;
  }
}

function moveAndRefill() {
  let targetPieces = [];
  let initialYOffsets = [];
  let emptyCellCounts = new Array(COLS).fill(0);
  for (let col = 0; col < COLS; col++) {
    let emptyCells = 0;
    for (let row = ROWS - 1; row >= 0; row--) {
      const piece = pieces[row][col];
      if (!piece) {
        emptyCells++;
      } else if (emptyCells > 0) {
        pieces[row + emptyCells][col] = piece;
        pieces[row][col] = null;
        piece.position = [row + emptyCells, col];
        targetPieces.push({ row: row + emptyCells, col });
        initialYOffsets.push(-emptyCells * PIECE_SIZE);
      }
    }
    emptyCellCounts[col] = emptyCells;
    let yOffsetOffset = 0;
    for (let i = 0; i < emptyCells; i++) {
      const row = i;
      addPiece(pieces, row, col);
      targetPieces.push({ row, col });
      initialYOffsets.push(-((row + emptyCellCounts[col]) * PIECE_SIZE) - yOffsetOffset);
      yOffsetOffset -= PIECE_SIZE;
    }
  }
  animatePieces(targetPieces, initialYOffsets, () => {
    removeAndRefillMatches();
  });
}


//-------------
//  Animate
//-------------
function animatePieces(targetPieces, initialYOffsets, onComplete) {
  const fallTimePerCell = 0.125;
  let piecesToAnimate = targetPieces.length;
  targetPieces.forEach(({ row, col }, index) => {
    let piece = pieces[row][col];
    let div = createDiv(row, col)

    div.className = 'piece';
    div.classList.add(pieces[row][col].color);
    addSpecialClass(div, piece)

    div.style.transform = `translate(0px, ${initialYOffsets[index]}px)`;
    const delay = 100;
    setTimeout(() => {
      const distance = Math.abs(initialYOffsets[index]);
      const cellsToFall = distance / PIECE_SIZE;
      const duration = cellsToFall * fallTimePerCell;
      div.style.transition = `transform ${duration}s cubic-bezier(0.34, 1.41, 0.4, 0.895)`; //少し行き過ぎる
      // div.style.transition = `transform ${duration}s cubic-bezier(0.55, 0.085, 0.68, 0.53)`; //ease in
      // div.style.transition = `transform ${duration}s linear`;
      div.style.transform = `translate(0px, 0px)`;
    }, delay);
    div.addEventListener('transitionend', function onTransitionEnd() {
      div.style.transition = '';
      div.style.transform = '';
      div.removeEventListener('transitionend', onTransitionEnd);
      piecesToAnimate--;
      if (piecesToAnimate === 0 && onComplete) {
        onComplete();
      }
    });
  });
}



//-------------
//   Init.
//-------------
function initializeBoard() {
  for (let row = 0; row < ROWS; row++) {
    pieces[row] = [];
    for (let col = 0; col < COLS; col++) {
      addPiece(pieces, row, col);
    }
  }
}

function initializePieces() {
  toggleAnimatingStat(true);
  initializeSpecialPieces();

  // ボードを初期化
  initializeBoard();

  // すべてのピースを削除したことにしてから moveAndRefill() を呼び出す
  pieces.forEach((row, rowIndex) => {
    row.forEach((piece, colIndex) => {
      pieces[rowIndex][colIndex] = null;
      clearInnerHTML(rowIndex, colIndex);
    });
  });
  moveAndRefill();
  addDraggableEvents();
}
