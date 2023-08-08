//-------------
//  import
//-------------
import { colors } from "./constants.js";
import { addSpecialClass } from "./specialManagement.js";


//-------------
//  export
//-------------
export {
  table,
  clearInnerHTML,
  getElement,
  createDiv,
  addPieceToDOM,
  addSpecialClass,
};

//-------------
// Constants
//-------------
const table = document.getElementById('table');


//-------------
//    DOM
//-------------
function clearInnerHTML(row, col) {
  const td = table.rows[row].cells[col];
  td.innerHTML = '';
}

function getElement(row, col) {
  return table.rows[row].cells[col].querySelector('.piece-shadow');
}

function createDiv(row, col) {
  let shadowDiv = getElement(row, col);
  if (!shadowDiv) {
    shadowDiv = document.createElement('div');
    shadowDiv.classList.add('piece-shadow');
    table.rows[row].cells[col].appendChild(shadowDiv);
  }
  let div = shadowDiv.querySelector('.piece');
  if (!div) {
    div = document.createElement('div');
    div.classList.add('piece');
    shadowDiv.appendChild(div);
  }
  return div;
}

function addPieceToDOM(piece) {
  const [row, col] = piece.position;
  let div = createDiv(row, col);
  colors.forEach(color => {
    div.classList.remove(color);
  });
  div.classList.add(piece.color);
  addSpecialClass(div, piece);
}

