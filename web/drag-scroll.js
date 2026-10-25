// Mouse dragging supplements native touch/trackpad scrolling without stealing clicks.
export function mouseDragScroll(element, {onStart, onEnd} = {}) {
  let gesture, blockClick = false, clickTimer;
  const refresh = () => element.classList.toggle('mouse-scrollable', element.scrollWidth > element.clientWidth + 1);
  const finish = cancelled => {
    if (!gesture) return;
    const ended = gesture; gesture = null; ended.events.abort();
    element.classList.remove('is-mouse-dragging');
    if (element.hasPointerCapture(ended.id)) element.releasePointerCapture(ended.id);
    if (ended.dragging) {
      blockClick = true; clearTimeout(clickTimer);
      clickTimer = setTimeout(() => { blockClick = false; }, 300);
      if (element.isConnected) onEnd?.({cancelled});
    }
  };
  const move = event => {
    if (!gesture || event.pointerId !== gesture.id) return;
    if (!(event.buttons & 1)) { finish(true); return; }
    let dx = event.clientX - gesture.x;
    if (!gesture.dragging) {
      if (Math.abs(event.clientY - gesture.y) > Math.max(6, Math.abs(dx))) { finish(true); return; }
      if (Math.abs(dx) <= 6) return;
      gesture.dragging = true;
      element.classList.add('is-mouse-dragging');
      element.setPointerCapture(event.pointerId);
      element.querySelectorAll('.is-pressed').forEach(button => button.classList.remove('is-pressed'));
      onStart?.();
    }
    event.preventDefault();
    const desired = gesture.left - dx;
    const left = Math.max(0, Math.min(element.scrollWidth - element.clientWidth, desired));
    element.scrollTo({left, behavior:'instant'});
    // Reversing direction at either edge should respond immediately.
    if (left !== desired) { gesture.left = left; gesture.x = event.clientX; }
  };
  const down = event => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || !event.isPrimary || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    blockClick = false; clearTimeout(clickTimer); refresh();
    if (element.scrollWidth <= element.clientWidth + 1 || event.target.closest('input,textarea,select,[contenteditable=true]')) return;
    finish(true);
    const events = new AbortController();
    gesture = {id:event.pointerId, x:event.clientX, y:event.clientY, left:element.scrollLeft, dragging:false, events};
    window.addEventListener('pointermove', move, {signal:events.signal, passive:false});
    window.addEventListener('pointerup', event => { if (event.pointerId === gesture?.id) finish(false); }, {signal:events.signal});
    window.addEventListener('pointercancel', () => finish(true), {signal:events.signal});
    window.addEventListener('blur', () => finish(true), {signal:events.signal});
  };
  const click = event => {
    if (!blockClick || event.detail === 0 || event.pointerType === 'touch') return;
    blockClick = false; event.preventDefault(); event.stopImmediatePropagation();
  };
  const nativeDrag = event => { if (gesture) event.preventDefault(); };
  const captureLost = event => { if (event.pointerId === gesture?.id) finish(true); };
  element.addEventListener('pointerdown', down);
  element.addEventListener('click', click, true);
  element.addEventListener('dragstart', nativeDrag);
  element.addEventListener('lostpointercapture', captureLost);
  element.addEventListener('pointerenter', refresh);
  const observer = new ResizeObserver(refresh); observer.observe(element); refresh();
  return () => {
    finish(true); clearTimeout(clickTimer); observer.disconnect();
    element.removeEventListener('pointerdown', down);
    element.removeEventListener('click', click, true);
    element.removeEventListener('dragstart', nativeDrag);
    element.removeEventListener('lostpointercapture', captureLost);
    element.removeEventListener('pointerenter', refresh);
    element.classList.remove('mouse-scrollable');
  };
}
