//-------------
//  Game State
//-------------

export { isAnimating, setAnimating };

let isAnimating = false;

function setAnimating(value) {
	isAnimating = Boolean(value);
}


