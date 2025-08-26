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
	isInputLocked,
	// new scene/phase state APIs
	AppScene,
	PlayPhase,
	getState,
	setScene,
	setPhase,
	beginAnim,
	endAnim,
	canInteract
};

const GameStatus = Object.freeze({
	Idle: 'idle',
	Animating: 'animating',
	Paused: 'paused',
});

// New: App-wide scenes and in-play phases
const AppScene = Object.freeze({
	Boot: 'boot',
	Title: 'title',
	Playing: 'playing',
	Paused: 'paused',
	GameOver: 'gameover',
});

const PlayPhase = Object.freeze({
	Ready: 'ready',
	Swapping: 'swapping',
	Resolving: 'resolving',
	Falling: 'falling',
	Spawning: 'spawning',
	Cascading: 'cascading',
});

let isAnimating = false; // backward-compat flag (derived from animatingCount)
let animatingCount = 0; // new: nested animation counter
let status = GameStatus.Idle; // backward-compat status

// new: scene/phase state
let scene = AppScene.Title; // initial scene
let phase = PlayPhase.Ready;

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
	if (v && status !== GameStatus.Paused) {
		status = GameStatus.Animating;
	} else if (!v && status === GameStatus.Animating) {
		status = GameStatus.Idle;
	}
}

// new: public getters/setters for scene/phase
function getState() {
	return {
		scene,
		phase,
		animatingCount,
		isAnimating,
		status
	};
}

function setScene(next) {
	if (!Object.values(AppScene).includes(next)) {
		throw new Error(`Invalid AppScene: ${next}`);
	}
	scene = next;
}

function setPhase(next) {
	if (!Object.values(PlayPhase).includes(next)) {
		throw new Error(`Invalid PlayPhase: ${next}`);
	}
	phase = next;
}

function beginAnim() {
	animatingCount += 1;
	if (status !== GameStatus.Paused) {
		status = GameStatus.Animating;
	}
}

function endAnim() {
	animatingCount = Math.max(0, animatingCount - 1);
	if (animatingCount === 0 && !isAnimating && status === GameStatus.Animating) {
		status = GameStatus.Idle;
	}
}

function isPaused() {
	return status === GameStatus.Paused;
}

function pause() {
	status = GameStatus.Paused;
	// reflect into scene state
	setScene(AppScene.Paused);
	// isAnimating stays as-is; consumers should gate input via isInputLocked
}

function resume() {
	status = isAnimating ? GameStatus.Animating : GameStatus.Idle;
	// reflect into scene state
	setScene(AppScene.Playing);
}

function isInputLocked() {
	return !canInteract();
}

// new: unified selector for interaction capability
function canInteract() {
	// Locked if paused or any kind of animation in progress (falls or swaps)
	return !(status === GameStatus.Paused || isAnimating || animatingCount > 0);
}
