// Spatial spring motion is independent of layout; interrupted animations cancel.
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const active = new WeakMap();
function animate(element, frames, duration = 320) {
  active.get(element)?.cancel();
  if (reduced.matches) return;
  const animation = element.animate(frames, {duration, easing: 'cubic-bezier(.2,.8,.2,1)'});
  active.set(element, animation);
}
const selector = 'button,a.primary-button,a.text-button';
let pressed;
document.addEventListener('pointerdown', event => {
  pressed?.classList.remove('is-pressed');
  pressed = event.target.closest(selector);
  if (pressed && !pressed.disabled) pressed.classList.add('is-pressed');
});
for (const event of ['pointerup','pointercancel','blur']) window.addEventListener(event, () => {
  pressed?.classList.remove('is-pressed'); pressed = null;
});
for (const dialog of document.querySelectorAll('dialog')) {
  const nativeClose = dialog.close.bind(dialog);
  let closing = false;
  dialog.close = value => {
    if (!dialog.open || closing) return;
    if (reduced.matches) { nativeClose(value); return; }
    closing = true;
    active.get(dialog)?.cancel();
    const exit = dialog.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(16px)'}], {duration:160,easing:'cubic-bezier(.2,0,0,1)'});
    exit.finished.then(() => { nativeClose(value); closing=false; }, () => { nativeClose(value); closing=false; });
  };
  dialog.addEventListener('cancel', event => {event.preventDefault(); dialog.close();});
  new MutationObserver(() => {
    if (dialog.open && !closing) animate(dialog, [{opacity:0,transform:'translateY(24px) scale(.96)'},{opacity:1,transform:'translateY(-2px) scale(1.005)',offset:.75},{opacity:1,transform:'none'}]);
  }).observe(dialog, {attributes:true,attributeFilter:['open']});
}
const grid = document.getElementById('packages');
new MutationObserver(() => {
  [...grid.children].slice(0,18).forEach((card,index) => {
    if (reduced.matches) return;
    card.animate([{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'none'}], {duration:240,delay:Math.min(index*18,108),easing:'cubic-bezier(.2,0,0,1)',fill:'backwards'});
  });
}).observe(grid,{childList:true});
