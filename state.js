//-------------
//  Game State
//-------------

export {
	isAnimating,
	setAnimating,
	GameStatus,
	getStatus,
	setStatus,
	isPaused,
	pause,
	resume,
	isInputLocked
};

const GameStatus = Object.freeze({
	Idle: 'idle',
	Animating: 'animating',
	Paused: 'paused',
});

let isAnimating = false;
let status = GameStatus.Idle;

function getStatus() {
	return status;
}

function setStatus(next) {
	if (!Object.values(GameStatus).includes(next)) {
		throw new Error(`Invalid GameStatus: ${next}`);
	}
	status = next;
	// Keep backward compatibility: sync isAnimating from status
	if (status === GameStatus.Animating) {
		isAnimating = true;
	} else if (isAnimating && status !== GameStatus.Animating) {
		isAnimating = false;
	}
}

function setAnimating(value) {
	const v = Boolean(value);
	isAnimating = v;
	// Reflect into status unless we're explicitly paused
	if (v && status !== GameStatus.Paused) {
		status = GameStatus.Animating;
	} else if (!v && status === GameStatus.Animating) {
		status = GameStatus.Idle;
	}
}

function isPaused() {
	return status === GameStatus.Paused;
}

function pause() {
	status = GameStatus.Paused;
	// isAnimating stays as-is; consumers should gate input via isInputLocked
}

function resume() {
	status = isAnimating ? GameStatus.Animating : GameStatus.Idle;
}

function isInputLocked() {
	return isAnimating || status === GameStatus.Paused;
}
