//-------------
//  import
//-------------
import {addDraggableEvents, addSwipeEvents} from './eventHandlers.js';
import './resize.js';
import './controls.js';
import { setScene, setPhase, AppScene, PlayPhase } from './state.js';
import { toggleTimeBar } from './timer.js';

// Initialize scene/phase on boot: show blank board, timer stopped
setScene(AppScene.Title);
setPhase(PlayPhase.Ready);
toggleTimeBar(false);


