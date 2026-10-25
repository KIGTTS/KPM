import { node, symbol } from './data.js';
import { loadingImage } from './media-loading.js';
import { mouseDragScroll } from './drag-scroll.js';

let active;
export function openPreview(entries, initial, opener) {
  if (active) return;
  const viewer = node('dialog', 'image-viewer'), heading = node('header', 'viewer-heading');
  viewer.setAttribute('aria-label', '图片预览');
  const counter = node('span', 'viewer-counter'), close = node('button', 'viewer-close');
  counter.setAttribute('aria-live', 'polite'); close.type = 'button';
  close.setAttribute('aria-label', '关闭图片预览'); close.title = '关闭图片预览'; close.append(symbol('close'));
  heading.append(counter, close);
  const stage = node('div', 'viewer-stage'), track = node('div', 'viewer-track');
  track.tabIndex = 0; track.setAttribute('aria-label', '左右滑动查看图片');
  entries.forEach(entry => {
    const slide = node('div', 'viewer-slide'), image = node('img');
    image.src = entry.src; image.alt = entry.alt; image.draggable = false;
    image.decoding = 'async'; slide.append(loadingImage(image)); track.append(slide);
  });
  const arrow = (label, back) => {
    const button = node('button', `viewer-arrow${back ? ' previous' : ''}`);
    button.type = 'button'; button.setAttribute('aria-label', label); button.title = label;
    button.append(symbol('arrow_forward')); return button;
  };
  const previous = arrow('上一张图片', true), next = arrow('下一张图片', false);
  stage.append(track, previous, next); viewer.append(heading, stage); document.body.append(viewer);
  let index = initial, closing = false, wheelAt = 0, wheelTotal = 0;
  const overflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const update = () => {
    index = Math.max(0, Math.min(entries.length - 1, Math.round(track.scrollLeft / (track.clientWidth || 1))));
    counter.textContent = `${index + 1} / ${entries.length}`;
    previous.disabled = index === 0; next.disabled = index === entries.length - 1;
  };
  const move = (target, instant = false) => {
    index = Math.max(0, Math.min(entries.length - 1, target));
    track.scrollTo({left:index * track.clientWidth,
      behavior:instant || matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  };
  const finish = () => {
    stopDragging(); observer.disconnect(); viewer.remove(); active = null;
    document.body.style.overflow = overflow;
    if (opener.isConnected) opener.focus({preventScroll:true});
  };
  const dismiss = () => {
    if (closing) return; closing = true;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { viewer.close(); return; }
    viewer.classList.add('is-closing');
    const fade = viewer.animate([{opacity:1}, {opacity:0}], {duration:150, easing:'ease-out'});
    fade.finished.then(() => viewer.close(), () => viewer.close());
  };
  close.addEventListener('click', dismiss);
  viewer.addEventListener('cancel', event => { event.preventDefault(); dismiss(); });
  viewer.addEventListener('close', finish, {once:true});
  previous.addEventListener('click', () => move(index - 1)); next.addEventListener('click', () => move(index + 1));
  track.addEventListener('scroll', update, {passive:true});
  viewer.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    move(event.key === 'Home' ? 0 : event.key === 'End' ? entries.length - 1 : index + (event.key === 'ArrowLeft' ? -1 : 1));
  });
  viewer.addEventListener('wheel', event => {
    if (track.classList.contains('is-mouse-dragging')) { event.preventDefault(); return; }
    if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    event.preventDefault();
    const now = performance.now();
    if (now - wheelAt < 300) return;
    wheelTotal += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? track.clientWidth : 1);
    if (Math.abs(wheelTotal) < 35) return;
    move(index + Math.sign(wheelTotal)); wheelAt = now; wheelTotal = 0;
  }, {passive:false});
  const observer = new ResizeObserver(() => move(index, true));
  const stopDragging = mouseDragScroll(track, {onEnd:() => move(Math.round(track.scrollLeft / (track.clientWidth || 1)))});
  active = viewer; viewer.showModal(); move(initial, true); update(); observer.observe(track); close.focus();
}
