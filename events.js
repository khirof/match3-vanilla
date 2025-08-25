//-------------
//  Events utility
//-------------

export function waitForEvent(element, eventName, timeoutMs = 3000) {
  return new Promise((resolve) => {
    if (!element) {
      resolve();
      return;
    }
    let settled = false;
    const onEvent = (event) => {
      if (settled) return;
      if (event && event.target !== element) return;
      settled = true;
      element.removeEventListener(eventName, onEvent, { once: true });
      resolve();
    };
    element.addEventListener(eventName, onEvent, { once: true });
    setTimeout(() => {
      if (settled) return;
      settled = true;
      element.removeEventListener(eventName, onEvent, { once: true });
      resolve();
    }, timeoutMs);
  });
}


