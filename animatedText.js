//-------------
// Animated Text controls
//-------------

export function toggleAnimatedText(shouldRun) {
  const animatedText = document.getElementById('animated-text');
  if (!animatedText) return;
  const liElements = animatedText.querySelectorAll('li');
  liElements.forEach((li) => {
    if (shouldRun) {
      li.style.animationPlayState = 'running';
    } else {
      resetAnimatedText();
    }
  });
}

export function resetAnimatedText() {
  const animatedText = document.getElementById('animated-text');
  if (!animatedText) return;
  const liElements = animatedText.querySelectorAll('li');
  liElements.forEach((li) => {
    li.style.animation = 'none';
    void li.offsetWidth;
    li.style.animation = null;
  });
}


