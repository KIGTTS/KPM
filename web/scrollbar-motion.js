// Show custom scrollbars only while a region is actively being used.
const timers = new WeakMap();
const watched = new WeakSet();

function markScrollable(element) {
  if (watched.has(element)) return;
  const style = getComputedStyle(element);
  if (!/(auto|scroll|overlay)/.test(style.overflowX + style.overflowY)) return;
  watched.add(element);
  element.classList.add('scroll-watch');
  const reveal = () => {
    element.classList.add('is-scrolling');
    clearTimeout(timers.get(element));
    timers.set(element, setTimeout(() => element.classList.remove('is-scrolling'), 700));
  };
  element.addEventListener('scroll', reveal, {passive: true});
  element.addEventListener('focusin', reveal);
}

function scan() {
  document.querySelectorAll('*').forEach(markScrollable);
}

scan();
new MutationObserver(scan).observe(document.documentElement, {childList: true, subtree: true});
