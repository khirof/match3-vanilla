//-------------
//  import
//-------------
import { PIECE_SIZE } from './constants.js';
import { isAnimating } from './state.js';
import { table } from './domManipulation.js';
import { pieces } from './pieceManagement.js';
import { handleDrop, handleDrag, resetDragAttributes } from './dragAndSwap.js'

//-------------
//  export
//-------------
export {
  addDraggableEvents,
  addSwipeEvents
}

//-------------
//    Drag
//-------------
function addDraggableEvents() {
  interact('.piece-shadow').draggable({
    start: onStart,
    listeners: {
      move: onMove,
      end: onEnd,
    },
  }).on('dragleave', onDragLeave);
  addSwipeEvents();
}

function onStart(event) {
  const target = event.target;
  target.dataset.startX = event.clientX;
  target.dataset.startY = event.clientY;
}

function onMove(event) {
  if (isAnimating) return;
  const target = event.target;
  const dx = (parseFloat(target.dataset.x) || 0) + event.dx;
  const dy = (parseFloat(target.dataset.y) || 0) + event.dy;
  const maxDistance = PIECE_SIZE;
  const limitedDx = Math.max(Math.min(dx, maxDistance), -maxDistance);
  const limitedDy = Math.max(Math.min(dy, maxDistance), -maxDistance);
  target.style.transform = `translate(${limitedDx}px, ${limitedDy}px)`;
  target.dataset.x = limitedDx;
  target.dataset.y = limitedDy;
}

function onEnd(event) {
  if (isAnimating) return;
  const target = event.target;
  const dx = parseFloat(target.dataset.x) || 0;
  const dy = parseFloat(target.dataset.y) || 0;
  if (Math.abs(dx) >= PIECE_SIZE / 2 || Math.abs(dy) >= PIECE_SIZE / 2) {
    handleDrop(event);
  } else {
    resetDragAttributes(target);
  }
}

function onDragLeave(event) {
  resetDragAttributes(event.target);
}

// reset is centralized in dragAndSwap.js as resetDragAttributes


//-------------
//  Swipe
//-------------
function addSwipeEvents() {
  let startX, startY;

  table.addEventListener('touchstart', (event) => {
    if (isAnimating) return;
    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
  });

  table.addEventListener('touchmove', (event) => {
    event.preventDefault();
  });

  table.addEventListener('touchend', (event) => {
    if (isAnimating) return;
    const endX = event.changedTouches[0].clientX;
    const endY = event.changedTouches[0].clientY;
    const diffX = endX - startX;
    const diffY = endY - startY;
    if (Math.abs(diffX) > PIECE_SIZE || Math.abs(diffY) > PIECE_SIZE) {
      const target = document.elementFromPoint(startX, startY);
      if (target && target.classList.contains('piece')) {
        const td = target.parentElement;
        const col = td.cellIndex;
        const row = td.parentElement.rowIndex;
        const newRow = row + Math.round(diffY / PIECE_SIZE);
        const newCol = col + Math.round(diffX / PIECE_SIZE);
        const piece = pieces[row][col];
        if (!piece) return;
        handleDrag(piece, newRow, newCol, row, col);
        resetDragAttributes(target);
      }
    }
  });
}

