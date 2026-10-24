// Each scrollable region fades independently, including the document viewport.
const timers = new WeakMap();
const watched = new WeakSet();
function watch(element, viewport = false) {
  if (watched.has(element)) return;
  const style = getComputedStyle(element);
  if (!viewport && !/(auto|scroll|overlay)/.test(style.overflowX + style.overflowY)) return;
  watched.add(element);
  element.classList.add('scroll-watch');
  const reveal = () => {
    element.classList.add('is-scrolling');
    clearTimeout(timers.get(element));
    timers.set(element, setTimeout(() => element.classList.remove('is-scrolling'), 700));
  };
  (viewport ? document : element).addEventListener('scroll', reveal, {passive: true});
  element.addEventListener('focusin', reveal);
}
function scan(root) {
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  watch(root);
  root.querySelectorAll('*').forEach(element => watch(element));
}
watch(document.scrollingElement, true);
scan(document.body);
new MutationObserver(records => {
  for (const record of records) record.addedNodes.forEach(scan);
}).observe(document.body, {childList: true, subtree: true});
