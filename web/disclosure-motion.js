// Keep native details/summary semantics, including keyboard activation.
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const running = new Map();
const panels = new WeakMap();

function panelFor(details, summary) {
  if (panels.has(details)) return panels.get(details);
  const panel = document.createElement('div');
  panel.className = 'disclosure-panel';
  const content = document.createElement('div');
  content.className = 'disclosure-content';
  while (summary.nextSibling) content.append(summary.nextSibling);
  panel.append(content);
  details.append(panel);
  const state = {panel, content};
  panels.set(details, state);
  return state;
}

function finish(details, state) {
  if (running.get(details) !== state) return;
  running.delete(details);
  state.observer.disconnect();
  state.animation?.cancel();
  details.open = state.open;
  state.panel.style.removeProperty('height');
  state.panel.classList.remove('is-animating');
  state.summary.removeAttribute('aria-expanded');
  details.removeAttribute('data-expanded');
}

document.addEventListener('click', event => {
  const summary = event.target.closest('summary');
  if (!summary || summary.parentElement?.tagName !== 'DETAILS' || event.defaultPrevented) return;
  if (event.target.closest('a,button,input,select,textarea')) return;
  const details = summary.parentElement;
  if (reduced.matches) return;
  event.preventDefault();
  const previous = running.get(details);
  const open = previous ? !previous.open : !details.open;
  const {panel, content} = panelFor(details, summary);
  const from = details.open ? panel.getBoundingClientRect().height : 0;
  previous?.observer.disconnect();
  previous?.animation?.cancel();
  details.open = true;
  summary.setAttribute('aria-expanded', String(open));
  details.dataset.expanded = String(open);
  panel.classList.add('is-animating');
  const state = {open, panel, summary, animation:null, observer:null};
  running.set(details, state);
  function transition(start) {
    const target = open ? content.getBoundingClientRect().height : 0;
    panel.style.height = `${target}px`;
    state.animation = panel.animate([{height:`${start}px`},{height:`${target}px`}], {
      duration:open ? 280 : 220, easing:'cubic-bezier(.2,0,0,1)'
    });
    state.animation.finished.then(() => finish(details, state), () => {});
  }
  let measured = content.getBoundingClientRect().height;
  state.observer = new ResizeObserver(() => {
    const height = content.getBoundingClientRect().height;
    if (!open || Math.abs(height - measured) < .5 || running.get(details) !== state) return;
    measured = height;
    const current = panel.getBoundingClientRect().height;
    state.animation?.cancel();
    transition(current);
  });
  state.observer.observe(content);
  transition(from);
});

function settle() {
  for (const [details, state] of running) finish(details, state);
}
reduced.addEventListener('change', settle);
window.addEventListener('pagehide', settle);
