//-------------
//  import
//-------------
import { pieces } from './pieceManagement.js';
import { addPieceToDOM, getElement } from "./domManipulation.js";
import { waitForEvent } from './utils.js';
import { ROWS, COLS } from "./constants.js";
import { ExplosiveButton } from './explosiveButton.js';


//-------------
//  export
//-------------
export {
  initializeSpecialPieces,
  applySpecialEffect,
  addSpecialClass,
  applySpecialPieceRules,
  applySpecialMix,
  findSpecialPiece
};


//-------------
//  Constants
//-------------
const specialPieceTypes = [];
function initializeSpecialPieces() {
  if (specialPieceTypes.length) return;
  specialPieceTypes.push(
    {
      specialType: 'bomb',
      minMatchCount: 5,
      element: 'bomb',
      animationClass: 'bomb-animation',
      affectedCondition: (row, col, r, c) => Math.abs(r - row) <= 1 && Math.abs(c - col) <= 1,
    },
    {
      specialType: 'horizontalStripe',
      matchCount: 4,
      element: 'stripe',
      direction: 'row',
      animationClass: 'horizontal-stripe-animation',
      affectedCondition: (row, col, r, c) => c === col,
    },
    {
      specialType: 'verticalStripe',
      matchCount: 4,
      element: 'stripe',
      direction: 'col',
      animationClass: 'vertical-stripe-animation',
      affectedCondition: (row, col, r, c) => r === row,
    },
    {
      specialType: 'waitingBomb',
      animationClass: 'bomb-animation',
      affectedCondition: (row, col, r, c) => Math.abs(r - row) <= 1 && Math.abs(c - col) <= 1,
    },
    {
      specialType: 'doubleBomb',
      mixedElements: 'bombbomb',
      animationClass: 'doubleBomb-animation',
      affectedCondition: (row, col, r, c) => Math.abs(r - row) <= 2 && Math.abs(c - col) <= 2,
    },
    {
      specialType: 'waitingDoubleBomb',
      animationClass: 'bomb-animation',
      affectedCondition: (row, col, r, c) => Math.abs(r - row) <= 2 && Math.abs(c - col) <= 2,
    },
    {
      specialType: 'horizontalBomb',
      mixedElements: 'bombstripe',
      direction: 'row',
      animationClass: 'horizontalBomb-animation',
      affectedCondition: (row, col, r, c) => Math.abs(c - col) <= 1,
    },
    {
      specialType: 'verticalBomb',
      mixedElements: 'bombstripe',
      direction: 'col',
      animationClass: 'verticalBomb-animation',
      affectedCondition: (row, col, r, c) => Math.abs(r - row) <= 1,
    },
    {
      specialType: 'cross',
      mixedElements: 'stripestripe',
      animationClass: 'cross-stripe-animation',
      affectedCondition: (row, col, r, c) => r === row || c === col,
    }
  );
}


//-------------
//    Mix
//-------------
//ミックス結果の特殊ピースを返す。1にMixを入れて、2はspecialはく奪。
function applySpecialMix(specialPiece1, specialPiece2) {
  const specialPieceType1 = getSpecialPieceType(specialPiece1) ;
  const specialPieceType2 = getSpecialPieceType(specialPiece2) ;
  const element1 = specialPieceType1.element;
  const element2 = specialPieceType2.element;
  const direction = isSpecialMixDirection(specialPieceType1, specialPieceType2);
  const mixedElements = [element1, element2].sort().join('');     //文字結合以外のもっとスマートなやり方やりたい

  let mixSpecialType = null;
  specialPieceTypes.forEach(piece => {
    if (piece.mixedElements === mixedElements && ((!piece.direction) || (piece.direction) === direction)) {
      mixSpecialType = piece.specialType;
    }
  }); 

  updateSpecialType(specialPiece1, mixSpecialType);
  updateSpecialType(specialPiece2, 'none');
}

//ミックスの方向を返す。directionプロパティ。ひとまず超簡易ロジック
function isSpecialMixDirection(specialPieceType1, specialPieceType2) {
  return specialPieceType1.direction !== undefined ? specialPieceType1.direction : specialPieceType2.direction;
}

//特殊ピース定義オブジェクトを呼び出す。input普通のpiece, out タイプオブジェクト
function getSpecialPieceType(specialPiece) {
  let specialPieceType = null;
  specialPieceTypes.forEach(piece => {
    if (piece.specialType === specialPiece.specialType) {
      specialPieceType = piece;
    }
  });
  return specialPieceType;
}


//-------------
//    Add
//-------------
function applySpecialPieceRules(matches, swapedPieces = null) {
  const uniqueMatches = swapedPieces ? matches : combineOverlappingMatches(matches);
  const specialPieceCoords = swapedPieces
    ? swapedPieces.filter(Boolean).map((piece) => ({
      row: piece.position[0],
      col: piece.position[1]
    }))
    : uniqueMatches.map(getSpecialPieceCoord);
  const updatedMatches = specialPieceCoords.map((coord, index) => {
    const piece = pieces[coord.row][coord.col];
    return piece ? checkAndAddSpecial(piece, uniqueMatches[index]) : uniqueMatches[index];
  });
  return updatedMatches.flat();
}

function checkAndAddSpecial(piece, match) {
  const specialPiece = generateSpecialPiece(match);
  if (specialPiece) {
    // ピースを特殊ピースに変更
    addSpecialPiece(piece, specialPiece);
    
    // match の中に特殊ピースの情報を更新
    const specialPieceIndex = match.findIndex(p => p.row === piece.position[0] && p.col === piece.position[1]);
    if (specialPieceIndex !== -1) {
      // match 内の該当するピース情報を特殊ピース情報に変更
      match[specialPieceIndex].special = specialPiece;
    }

    // match から元のピースを削除（もしくは別の方法で処理する）
    removePieceFromMatches(piece, match);
  }
  return match;
}


function generateSpecialPiece(matchingPieces) {
  const matchCount = matchingPieces.length;
  if (matchCount === 0) return null;

  const specialPieceType = specialPieceTypes.find(special =>
    (special.minMatchCount ? matchCount >= special.minMatchCount : special.matchCount === matchCount) &&
    (!special.direction || isMatchInDirection(special.direction, matchingPieces))
  );

  return specialPieceType ? { specialType: specialPieceType.specialType, color: 'special' } : null;
}

function isMatchInDirection(direction, matchingPieces) {
  return direction === (matchingPieces[0].position[0] === matchingPieces[1].position[0] ? 'row' : 'col');
}

async function addSpecialPiece(piece, specialPiece) {
  const [row, col] = piece.position;
  specialPiece.position = [row, col];
  pieces[row][col] = specialPiece;
  const div = getElement(row, col);

  // ラッパーにアニメーションを付与（.piece はいじらない）
  div.classList.add('create');

  // アニメーション終了を待機
  const animationEndPromise = new Promise((resolve) => {
    const handler = (event) => {
      if (event.target === div) {
        div.removeEventListener('animationend', handler);
        resolve();
      }
    };
    div.addEventListener('animationend', handler);
  });

  await animationEndPromise;

  // アニメーション終了後にクラスを外し、特殊ピースを反映
  div.classList.remove('create');
  addPieceToDOM(specialPiece);
}

function addSpecialClass(div, piece) {
  if (piece && piece.specialType) {
    div.classList.add('special', piece.specialType);
  } else {
    div.classList.remove('special');
  }
}


//-------------
//   Effect
//-------------
async function applySpecialEffect(piecesToCheck, allAffectedPieces, initialNoSpecialPieces = [], isInitialEffect = false) {
  const nextSpecialPieces = [];
  let affectedPiecesThisLoop = []; // このループで影響を受ける通常ピースを格納する配列
  const animationPromises = [];

  if (isInitialEffect) {
    affectedPiecesThisLoop.push(...initialNoSpecialPieces);
  }

  // row-col キーでの包含・重複判定に切替
  const allAffectedKeySet = new Set(allAffectedPieces.filter(Boolean).map(getPieceKey));
  const piecesToCheckKeySet = new Set(piecesToCheck.filter(Boolean).map(getPieceKey));

  for (const piece of piecesToCheck.filter(Boolean)) {
    const [row, col] = piece.position;
    let affectedPieces = specialAffectedPieces(piece); // 効果範囲算出
    // 効果範囲重複排除（参照同一性ではなく座標キーで判定）
    affectedPieces = affectedPieces.filter((affectedPiece) => {
      const key = getPieceKey(affectedPiece);
      return key && !allAffectedKeySet.has(key) && !piecesToCheckKeySet.has(key);
    });
    allAffectedPieces = allAffectedPieces.concat(affectedPieces); // 効果範囲合成
    // Set も更新
    affectedPieces.forEach((p) => {
      const key = getPieceKey(p);
      if (key) allAffectedKeySet.add(key);
    });
    nextSpecialPieces.push(...affectedPieces.filter((p) => p.specialType)); // 新しく効果範囲内になった特殊ピース追加
    affectedPiecesThisLoop.push(...affectedPieces.filter((p) => !p.specialType)); // このループで影響を受ける通常ピースを格納

    animationPromises.push(animateSpecialPiece(piece));
  }
  // このループで影響を受けるピースをユニーク化し、1回だけアニメーション実行
  const uniqueAffectedPiecesThisLoop = uniqueByKey(affectedPiecesThisLoop);
  if (uniqueAffectedPiecesThisLoop.length > 0) {
    animationPromises.push(animateAffectedPieces(uniqueAffectedPiecesThisLoop));
  }
  await Promise.all(animationPromises);

  if (nextSpecialPieces.length === 0) { // 再帰処理ラスト
    return applySpecialEffectExitFn(allAffectedPieces);
  } else {
    return applySpecialEffect(nextSpecialPieces, allAffectedPieces);
  }
}

function applySpecialEffectExitFn(allAffectedPieces) {
  const updatedAllAffectedPieces = allAffectedPieces.filter((piece) => {
    if (!piece) return false;
    if (piece.specialType && piece.shouldRetain) {
      piece.shouldRetain = false
      return false;
    } 
    return true;
  });
  return updatedAllAffectedPieces;       
}


//-------------
//Effect Parts
//-------------
function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function animateSpecialPiece(piece) {
  if (!piece || piece.specialType === 'none') return;
  const [row, col] = piece.position;
  const div = getElement(row, col);
  const specialPieceType = specialPieceTypes.find(type => type.specialType === piece.specialType) || {};
  const animationClass = specialPieceType.animationClass;

  if (piece.specialType === 'waitingBomb' || piece.specialType === 'waitingDoubleBomb') {
    await explodeAnimation(piece, div);
    return;
  }

  if (piece.specialType === 'cross') {
    const div2 = div.querySelector('.piece');
    div2.style.background = '#FFFFFF';
  }

  // スタイルの再計算を強制
  void div.offsetWidth;

  // 開始前にリスナーを登録してからアニメーションを付与
  div.classList.add(animationClass);
  await waitForEvent(div, 'animationend', 1500);

  // cleanup / state updates
  div.classList.remove(animationClass);
  if (piece.specialType === 'bomb' || piece.specialType === 'horizontalBomb' || piece.specialType === 'verticalBomb') {
    updateSpecialType(piece, 'waitingBomb');
    piece.shouldRetain = true;
  } else if (piece.specialType === 'doubleBomb') {
    updateSpecialType(piece, 'waitingDoubleBomb');
    piece.shouldRetain = true;
  } else if (!piece.shouldRetain) {
    piece.shouldRetain = false;
    div.classList.add('hide');
  }
}


async function explodeAnimation(piece, div) {
  if (!piece) return;
  const explosiveButton = new ExplosiveButton(div);
  if (piece.specialType === 'waitingDoubleBomb') {
    explosiveButton.explode(1500, true);  //larger flag on
  } else {
    explosiveButton.explode(1500);
  }
  await delay(1000);
  div.style.opacity = 0;  //waitingBomb はCSSフェードアウトさせてないのでここで強制0。本当は、描画を分けて最初に0にしたい（タイミングミスるとおかしくなる
}

async function animateAffectedPieces(affectedPieces) {
  const promises = affectedPieces.map(async (piece) => {
    if (!piece) return;
    const [row, col] = piece.position;
    const div = getElement(row, col);
    const div2 = div.querySelector('.piece');

    // スタイルの再計算を強制
    void div2.offsetWidth;

    // 開始してからイベントを待つ
    div.classList.add('bubble');
    div2.classList.add('scale-out');
    await waitForEvent(div2, 'animationend', 1000);

    div.classList.remove('bubble');
    div2.classList.remove('scale-out');
    div.classList.add('hide');
  });

  await Promise.all(promises);
}


function specialAffectedPieces(piece) {
  let affectedPieces = [];
  const [row, col] = piece.position;
  const specialPiece = specialPieceTypes.find(sp => sp.specialType === piece.specialType);

  if (specialPiece && specialPiece.affectedCondition) {
    affectedPieces = addAffectedPieces(row, col, specialPiece.affectedCondition);
  }

  return affectedPieces;
}

function addAffectedPieces(row, col, condition) {
  let affectedPieces = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (condition(row, col, r, c)) {
        const piece = pieces[r][c];
        if (!piece) continue;
        affectedPieces.push(piece);
      }
    }
  }
  return affectedPieces;
}


//-------------
//   Update
//-------------
function updateSpecialType(piece, newType) {
  if (!piece) return;
  const [row, col] = piece.position;
  piece.specialType = newType;
  const div = getElement(row, col);
  const div2 = div.querySelector('.piece');
  updateSpecialClass(div2, piece);
}

function updateSpecialClass(div, piece) {
  const allSpecialClasses = ['special', ...specialPieceTypes.map(t => t.specialType)];
  div.classList.remove(...allSpecialClasses);
  if (piece.specialType && piece.specialType !== 'none') {
    div.classList.add('special', piece.specialType);
  }
}

//-------------
// forPieceMgt
//-------------
function findSpecialPiece(specialTypes) {
  const foundPieces = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const piece = pieces[row][col];
      if (!piece) continue;
      if (specialTypes.includes(piece.specialType)) {
        foundPieces.push(piece);
      }
    }
  }
  return foundPieces;
}

//-------------
// Calc Pos to AddSp 
//-------------
function combineOverlappingMatches(matches) {
  function findOverlappingMatches(match, remainingMatches) {
    if (remainingMatches.length === 0) return match;

    const overlaps = remainingMatches.filter(m => m.some(piece => match.includes(piece)));

    if (overlaps.length === 0) return match;

    const newMatch = [...new Set([...match, ...overlaps.flat()])];
    const newRemainingMatches = remainingMatches.filter(m => !overlaps.includes(m));

    return findOverlappingMatches(newMatch, newRemainingMatches);
  }

  const uniqueMatches = [];

  matches.forEach(match => {
    const combinedMatch = findOverlappingMatches(match, matches.filter(m => m !== match));
    const sortedCombinedMatch = combinedMatch.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    const sortedCombinedMatchKey = JSON.stringify(sortedCombinedMatch);

    const isUnique = !uniqueMatches.some(uniqueMatch => {
      const sortedUniqueMatch = uniqueMatch.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
      return JSON.stringify(sortedUniqueMatch) === sortedCombinedMatchKey;
    });

    if (isUnique) {
      uniqueMatches.push(combinedMatch);
    }
  });
  return uniqueMatches;
}

function getSpecialPieceCoord(match) {
  const piecesWithAdjacentCount = match.map(piece => ({
    piece,
    adjacentCount: countAdjacentPieces(piece, match),
  }));

  const maxAdjacentCount = Math.max(...piecesWithAdjacentCount.map(p => p.adjacentCount));
  const maxAdjacentPieces = piecesWithAdjacentCount.filter(p => p.adjacentCount === maxAdjacentCount);
  if (maxAdjacentPieces.length === 1) {
    return {
      row: maxAdjacentPieces[0].piece.position[0],
      col: maxAdjacentPieces[0].piece.position[1]
    };
  } else {
    const middlePieceCoord = getMiddlePieceCoord(maxAdjacentPieces.map(p => p.piece));
    return {
      row: middlePieceCoord.row,
      col: middlePieceCoord.col
    };
  }
}

function countAdjacentPieces(piece, match) {
  const directions = [
    [-1, 0], // up
    [1, 0], // down
    [0, -1], // left
    [0, 1], // right
  ];
  let count = 0;
  
  for (const direction of directions) {
    const newRow = piece.position[0] + direction[0];
    const newCol = piece.position[1] + direction[1];
    if (match.some(p => p.position[0] === newRow && p.position[1] === newCol)) {
      count++;
    }
  }
  return count;
}

function getMiddlePieceCoord(match) {
  const minRow = Math.min(...match.map(piece => piece.position[0]));
  const maxRow = Math.max(...match.map(piece => piece.position[0]));
  const minCol = Math.min(...match.map(piece => piece.position[1]));
  const maxCol = Math.max(...match.map(piece => piece.position[1]));

  const middleRow = (minRow + maxRow) / 2;
  const middleCol = (minCol + maxCol) / 2;

  const middlePiece = match.slice().sort((a, b) => {
    const aDistance = Math.abs(a.position[0] - middleRow) + Math.abs(a.position[1] - middleCol);
    const bDistance = Math.abs(b.position[0] - middleRow) + Math.abs(b.position[1] - middleCol);

    if (aDistance !== bDistance) {
      return aDistance - bDistance;
    } else if (a.position[0] !== b.position[0]) {
      return a.position[0] - b.position[0];
    } else {
      return a.position[1] - b.position[1];
    }
  })[0];

  return {
    row: middlePiece.position[0],
    col: middlePiece.position[1]
  };
}


//-------------
//  Common? 
//-------------
function removePieceFromMatches(piece, matches) {
  const index = matches.indexOf(piece);
  if (index > -1) {
    matches.splice(index, 1);
  }
}


// 参照同一性に依存しないための共通ユーティリティ
function getPieceKey(piece) {
  if (!piece || !piece.position) return '';
  const [r, c] = piece.position;
  return `${r}-${c}`;
}

function uniqueByKey(piecesArray) {
  const seen = new Set();
  const result = [];
  for (const p of piecesArray) {
    if (!p) continue;
    const key = getPieceKey(p);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(p);
  }
  return result;
}

