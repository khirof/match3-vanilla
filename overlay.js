//-------------
// Overlay and GameOver animations
//-------------

function getOverlay() {
  return document.getElementById('overlay');
}

function getSpanElements() {
  return document.querySelectorAll('.animate.four span');
}

function getSpanContainer() {
  return document.querySelector('.gameOverContainer');
}

export function playSpanAnimations() {
  const spanElements = getSpanElements();
  const spanContainer = getSpanContainer();
  spanElements.forEach(() => {
    setTimeout(() => {
      if (spanContainer) spanContainer.style.zIndex = 110;
      // run each span animation
      spanElements.forEach((span) => {
        span.style.animationPlayState = 'running';
      });
    }, 100);
  });
}

export function resetSpanAnimations() {
  const spanElements = getSpanElements();
  const spanContainer = getSpanContainer();
  spanElements.forEach((span) => {
    if (spanContainer) spanContainer.style.zIndex = -1;
    span.style.animationPlayState = 'paused';
    span.style.animation = 'none';
    void span.offsetWidth;
    span.style.animation = '';
  });
}

export function playOverlayAnimation() {
  const overlay = getOverlay();
  if (!overlay) return;
  overlay.style.zIndex = 100;
  overlay.classList.add('fadeIn');
  overlay.addEventListener('animationend', () => {
    playSpanAnimations();
    overlay.style.pointerEvents = 'all';
  });
}

export function resetOverlayAnimation() {
  const overlay = getOverlay();
  if (!overlay) return;
  overlay.style.zIndex = -1;
  overlay.style.pointerEvents = 'none';
  overlay.classList.remove('fadeIn');
  void overlay.offsetWidth;
}

export function onOverlayClick(handler) {
  const overlay = getOverlay();
  if (!overlay) return;
  overlay.addEventListener('click', handler);
}


