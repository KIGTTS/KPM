import { marked } from './vendor/marked.esm.js';
import DOMPurify from './vendor/purify.es.js';
import { loadMask, loadingImage } from './media-loading.js';

export const node = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};
export const safeURL = value => {
  try { const url = new URL(value); return ['https:', 'http:', 'mailto:'].includes(url.protocol) && !url.username && !url.password ? url.href : ''; }
  catch { return ''; }
};
export function symbol(name) {
  const icon = node('span', 'symbol');
  const safe = /^[a-z0-9_]{1,80}$/.test(name) ? name : 'extension';
  icon.setAttribute('aria-hidden', 'true');
  return loadMask(icon, `symbols/${safe}.svg`);
}
export function icon(value, site) {
  const path = site.art?.[value?.image];
  if (path) {
    if (site.monochromeArt?.includes(value.image)) {
      const mask = node('span', 'symbol artwork-mask');
      mask.setAttribute('aria-hidden', 'true');
      return loadMask(mask, path);
    }
    const img = node('img'); img.src = path; img.alt = ''; img.loading = 'lazy';
    const frame = loadingImage(img, {errorText:''});
    img.addEventListener('error', () => frame.replaceWith(symbol(value?.symbol || 'extension')), { once: true });
    return frame;
  }
  return symbol(value?.symbol || 'extension');
}
export function latest(item) {
  const versions = item.releases || [];
  return [...versions].filter(x => !x.version.includes('-')).sort(compareVersions)[0] || [...versions].sort(compareVersions)[0];
}
export function compareVersions(a, b) {
  const va = a.version.split(/[.+-]/).slice(0, 3).map(Number), vb = b.version.split(/[.+-]/).slice(0, 3).map(Number);
  for (let index = 0; index < 3; index++) if (va[index] !== vb[index]) return vb[index] - va[index];
  return b.versionCode - a.versionCode;
}
const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export function markdown(text, site) {
  const target = node('div', 'markdown');
  const renderer = new marked.Renderer();
  renderer.html = token => escape(token.text);
  renderer.image = ({ href, text }) => {
    const path = href.startsWith('asset:') ? site.art?.[href.slice(6)] : null;
    if (path) return `<img src="${escape(path)}" alt="${escape(text)}" loading="lazy">`;
    const link = safeURL(href);
    return link ? `<a href="${escape(link)}" rel="noopener noreferrer">${escape(text || '查看图片')}</a>` : escape(text);
  };
  renderer.link = ({ href, text }) => {
    const link = safeURL(href);
    return link ? `<a href="${escape(link)}" rel="noopener noreferrer">${text}</a>` : text;
  };
  const html = marked.parse(String(text || '').slice(0, 32000), { gfm: true, breaks: false, renderer });
  target.innerHTML = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p','br','h1','h2','h3','h4','h5','h6','strong','em','del','code','pre','blockquote','ul','ol','li','table','thead','tbody','tr','th','td','hr','a','img','input'],
    ALLOWED_ATTR: ['href','src','alt','title','rel','loading','start','type','disabled','checked','align']
  });
  target.querySelectorAll('input').forEach(input => { if (input.type !== 'checkbox') input.remove(); else input.disabled = true; });
  target.querySelectorAll('img').forEach(image => {
    const asset = Object.entries(site.art || {}).find(([, path]) => image.getAttribute('src') === path)?.[0];
    const size = site.catalog.assets?.[asset];
    const placeholder = document.createElement('span'); image.replaceWith(placeholder);
    placeholder.replaceWith(loadingImage(image, {ratio:size?.width && size?.height ? size.width / size.height : undefined}));
  });
  return target;
}
