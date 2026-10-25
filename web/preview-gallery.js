import { node, symbol } from './data.js';
import { openPreview } from './preview-viewer.js';
import { loadingImage } from './media-loading.js';
import { mouseDragScroll } from './drag-scroll.js';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export function previewButton(label, previous = false) {
  const button = node('button', `preview-arrow${previous ? ' previous' : ''}`);
  button.type = 'button'; button.setAttribute('aria-label', label); button.title = label;
  button.append(symbol('arrow_forward'));
  return button;
}

export function createPreviewGallery(item, site) {
  const entries = (item.thumbnails || []).filter(id => site.art?.[id]).map(id => ({
    src: site.art[id], ...site.catalog.assets[id], alt: site.catalog.assets[id]?.alt || item.name,
  }));
  if (!entries.length) return null;
  const gallery = node('section', 'preview-gallery'), track = node('div', 'gallery-track');
  gallery.setAttribute('aria-label', `${item.name}图片预览`);
  track.tabIndex = 0; track.setAttribute('aria-label', '滚动查看图片');
  const cards = entries.map((entry, index) => {
    const figure = node('figure', 'preview-figure'), button = node('button', 'preview-image'), image = node('img');
    button.type = 'button'; button.setAttribute('aria-label', `放大预览：${entry.alt}`);
    image.src = entry.src; image.alt = entry.alt; image.loading = 'lazy'; image.decoding = 'async';
    if (entry.width && entry.height) {
      image.width = entry.width; image.height = entry.height;
      figure.style.setProperty('--preview-ratio', entry.width / entry.height);
    }
    image.addEventListener('load', () => {
      if (image.naturalHeight) figure.style.setProperty('--preview-ratio', image.naturalWidth / image.naturalHeight);
    }, {once:true});
    button.append(loadingImage(image)); button.addEventListener('click', () => openPreview(entries, index, button));
    figure.append(button); track.append(figure);
    return figure;
  });
  const previous = previewButton('上一张图片', true), next = previewButton('下一张图片');
  gallery.append(track, previous, next);
  const update = () => {
    previous.disabled = track.scrollLeft < 2;
    next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
  };
  const move = direction => {
    const origin = cards[0].offsetLeft;
    const current = cards.reduce((best, card, index) =>
      Math.abs(card.offsetLeft - origin - track.scrollLeft) < Math.abs(cards[best].offsetLeft - origin - track.scrollLeft) ? index : best, 0);
    const target = cards[Math.max(0, Math.min(cards.length - 1, current + direction))];
    track.scrollTo({left:target.offsetLeft - origin, behavior:reduced() ? 'instant' : 'smooth'});
  };
  previous.addEventListener('click', () => move(-1)); next.addEventListener('click', () => move(1));
  track.addEventListener('keydown', event => {
    if (event.target !== track || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1);
  });
  let wheelTarget = 0, lastWheel = 0, wheelTimer;
  track.addEventListener('wheel', event => {
    if (event.ctrlKey) return;
    if (track.classList.contains('is-mouse-dragging')) { event.preventDefault(); return; }
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    const amount = delta * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? track.clientWidth : 1);
    if (!amount || amount < 0 && track.scrollLeft <= 0 || amount > 0 && track.scrollLeft >= track.scrollWidth - track.clientWidth - 1) return;
    event.preventDefault();
    const now = performance.now();
    if (now - lastWheel > 300) wheelTarget = track.scrollLeft;
    lastWheel = now;
    wheelTarget = Math.max(0, Math.min(track.scrollWidth - track.clientWidth, wheelTarget + amount));
    track.classList.add('wheel-scrolling'); clearTimeout(wheelTimer);
    track.scrollTo({left:wheelTarget, behavior:reduced() ? 'instant' : 'smooth'});
    wheelTimer = setTimeout(() => track.classList.remove('wheel-scrolling'), 500);
  }, {passive:false});
  track.addEventListener('scroll', update, {passive:true});
  const stopDragging = mouseDragScroll(track, {onStart:() => {
    clearTimeout(wheelTimer); track.classList.remove('wheel-scrolling'); lastWheel = 0;
  }});
  // The gallery can be removed when another plugin is opened.
  const observer = new ResizeObserver(update); observer.observe(track);
  gallery.dispose = () => { stopDragging(); observer.disconnect(); clearTimeout(wheelTimer); };
  update();
  return gallery;
}
