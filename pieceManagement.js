//-------------
//  import
//-------------
import { ROWS, COLS, colors, PIECE_SIZE, FALL_START_DELAY_MS } from "./constants.js";
import { addPieceToDOM, clearInnerHTML, createDiv, getElement } from "./domManipulation.js";
import { applySpecialEffect, applySpecialPieceRules, initializeSpecialPieces, addSpecialClass, findSpecialPiece, waitForSpecialCreations } from "./specialManagement.js";
import { getMatchingPieces } from "./matchManagement.js";
import { toggleAnimatingStat } from './controls.js';
import { updateScore } from './score.js';
import { waitForEvent } from './events.js';
import { addDraggableEvents } from "./eventHandlers.js";
import { animatePieces } from './animation.js';


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
  const currentChain = chainCount; // 固定化してスコア計算のズレを防止
  updateScore(matches, currentChain);

  const specialPieces = matches.filter((piece) => piece.specialType);
  const nonSpecialPieces = matches.filter((piece) => !piece.specialType);
  const allAffectedPieces = await applySpecialEffect(specialPieces, specialPieces, nonSpecialPieces, true);
  const uniqueAffectedPieces = [...new Set(allAffectedPieces.concat(nonSpecialPieces))] ;

  uniqueAffectedPieces.forEach((piece) => {
    if (!piece) return;
    const [row, col] = piece.position;
    if (pieces[row]) {
      pieces[row][col] = null;
      clearInnerHTML(row, col)
    }
  });

  // ここで特殊生成アニメの完了を待つ（削除と並行で動いていたものを落下前に合流）
  await waitForSpecialCreations();

  // 次ループに進む直前で連鎖カウントを増やす
  chainCount++;
  moveAndRefill();
}


//-------------
//  Move
//-------------
async function removeAndRefillMatches() {
  //マッチ有無チェック。あれば格納
  const allMatches = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const piece = pieces[row][col];
      if (!piece) continue;
      const matchingPieces = getMatchingPieces(piece);
      if (matchingPieces.length > 0) {
        allMatches.push(matchingPieces);
      }
    }
  }
  
  //削除対象セット
  let piecesToRemove = [];
  if (allMatches.length > 0) {  //マッチ有なら特殊ピース生成して削除処理に進む
    piecesToRemove = await applySpecialPieceRules(allMatches);
  } else {  //マッチがない場合のみ、待機中ピースを起動(waitingBomb系)
    piecesToRemove = findSpecialPiece(['waitingBomb', 'waitingDoubleBomb']);
  }

  //削除対象があれば次のループへ。なければ削除再帰終了。
  if (piecesToRemove.length > 0) {
    await removePieces(piecesToRemove);
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
  animatePieces(pieces, targetPieces, initialYOffsets, async () => {
    await removeAndRefillMatches();
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
