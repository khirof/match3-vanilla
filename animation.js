//-------------
//  import
//-------------
import { PIECE_SIZE, FALL_START_DELAY_MS } from "./constants.js";
import { createDiv } from "./domManipulation.js";
import { addSpecialClass } from "./specialManagement.js";
import { waitForEvent } from './events.js';


//-------------
//  export
//-------------
export {
  animatePieces
}


//-------------
//  Animate
//-------------
async function animatePieces(piecesGrid, targetPieces, initialYOffsets, onComplete) {
  const fallTimePerCell = 0.125;
  const startDelayMs = FALL_START_DELAY_MS; // 演出ディレイ（開始直前）

  const animations = targetPieces.map(async ({ row, col }, index) => {
    let piece = piecesGrid[row][col];
    if (!piece) return;
    let div = createDiv(row, col)

    div.className = 'piece';
    if (piece && piece.color) {
      div.classList.add(piece.color);
    }
    addSpecialClass(div, piece)

    div.style.transform = `translate3d(0px, ${initialYOffsets[index]}px, 0)`;
    div.style.willChange = 'transform';

    const distance = Math.abs(initialYOffsets[index]);
    const cellsToFall = distance / PIECE_SIZE;
    const duration = cellsToFall * 0.125;

    const endPromise = waitForEvent(div, 'transitionend', Math.max(1000, (duration + (startDelayMs / 1000) + 0.2) * 1000));

    await new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          div.style.transition = `transform ${duration}s cubic-bezier(0.34, 1.41, 0.4, 0.895) ${startDelayMs}ms`;
          div.style.transform = `translate3d(0px, 0px, 0)`;
          resolve();
        });
      });
    });

    await endPromise;

    div.style.transition = '';
    div.style.transform = '';
    div.style.willChange = '';
  });

  await Promise.all(animations);
  if (onComplete) onComplete();
}


