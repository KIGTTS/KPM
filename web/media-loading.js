// Share mask downloads; the same icon can appear in several cards and dialogs.
const masks = new Map();
const setState = (frame, state) => {
  frame.classList.add(state); frame.setAttribute('aria-busy', 'false');
};
function decodedMask(source) {
  if (!masks.has(source)) masks.set(source, new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = async () => { try { await image.decode(); resolve(); } catch (error) { reject(error); } };
    image.onerror = reject; image.src = source;
  }));
  return masks.get(source);
}

export function loadMask(target, source) {
  target.classList.add('media-frame'); target.setAttribute('aria-busy', 'true');
  target.style.maskImage = 'none';
  const glyph = document.createElement('span'); glyph.className = 'media-content symbol-glyph';
  glyph.style.maskImage = `url("${source}")`; target.replaceChildren(glyph);
  decodedMask(source).then(() => setState(target, 'is-loaded'), () => setState(target, 'is-error'));
  return target;
}

export function loadingImage(image, {errorText = '图片暂时无法加载', ratio} = {}) {
  const frame = document.createElement('span'); frame.className = 'media-frame media-picture';
  frame.setAttribute('aria-busy', 'true');
  if (ratio) frame.style.aspectRatio = ratio;
  image.classList.add('media-content'); frame.append(image);
  let finished = false;
  const fail = () => {
    if (finished) return; finished = true; setState(frame, 'is-error');
    const message = document.createElement('span'); message.className = 'media-error';
    message.textContent = errorText; frame.append(message);
  };
  const reveal = async () => {
    try { await image.decode(); } catch { fail(); return; }
    if (finished) return; finished = true;
    setState(frame, 'is-loaded');
  };
  image.addEventListener('load', reveal, {once:true}); image.addEventListener('error', fail, {once:true});
  if (image.complete) { if (image.naturalWidth) reveal(); else if (image.currentSrc) fail(); }
  return frame;
}

export function hydrateMedia() {
  document.querySelectorAll('[data-symbol]').forEach(element => loadMask(element, `symbols/${element.dataset.symbol}.svg`));
  document.querySelectorAll('.brand-logo').forEach(element => loadMask(element, 'assets/kpm-logo.svg'));
  document.querySelectorAll('.scan-row img').forEach(image => {
    const anchor = document.createComment('image'); image.before(anchor);
    const frame = loadingImage(image);
    frame.style.width = `${image.width}px`; frame.style.height = `${image.height}px`;
    anchor.replaceWith(frame);
  });
}
