var words = document.getElementsByClassName('word');
var currentWord = 0;

// Initialize: show first word, hide others
for (var i = 0; i < words.length; i++) {
  words[i].style.opacity = (i === 0) ? 1 : 0;
}

export function changeWord() {
  if (!words || words.length === 0) return;
  var next = (currentWord === words.length - 1) ? 0 : currentWord + 1;
  words[currentWord].style.opacity = 0;
  words[next].style.opacity = 1;
  currentWord = next;
}

export function setWord(text) {
  if (!words || words.length === 0) return;
  // Find span containing exact text (case-insensitive)
  var targetIndex = -1;
  for (var i = 0; i < words.length; i++) {
    if (String(words[i].textContent).trim().toLowerCase() === String(text).trim().toLowerCase()) {
      targetIndex = i;
      break;
    }
  }
  if (targetIndex === -1) return;
  for (var j = 0; j < words.length; j++) {
    words[j].style.opacity = (j === targetIndex) ? 1 : 0;
  }
  currentWord = targetIndex;
}
