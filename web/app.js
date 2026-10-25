import { node, icon, latest, markdown, safeURL, symbol } from './data.js';
import { showDetail } from './detail.js';
import { sourceLink } from './source-link.js';
import './scrollbar-motion.js';
import { configureTheme, DEFAULT_SEED } from './theme.js';
import { hydrateMedia } from './media-loading.js';
import { catalogMotion } from './catalog-motion.js';
import { mouseDragScroll } from './drag-scroll.js';

const $ = id => document.getElementById(id);
const listMotion = catalogMotion($('packages'));
mouseDragScroll($('categories'));
let toastTimer;
function toast(message) {
  clearTimeout(toastTimer); $('toast').textContent = message; $('toast').classList.add('visible');
  toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 2400);
}
hydrateMedia();
for (const button of document.querySelectorAll('.close-dialog')) button.addEventListener('click', () => button.closest('dialog').close());
for (const dialog of document.querySelectorAll('dialog')) dialog.addEventListener('click', event => { if (event.target === dialog && (event.clientX < dialog.getBoundingClientRect().left || event.clientX > dialog.getBoundingClientRect().right || event.clientY < dialog.getBoundingClientRect().top || event.clientY > dialog.getBoundingClientRect().bottom)) dialog.close(); });
for (const id of ['guide-open', 'manual-open']) $(id).addEventListener('click', () => $('guide').showModal());
function openFallbackGuide() {
  if (location.hash !== '#add-guide' || $('guide').open) return;
  const other = document.querySelector('dialog[open]:not(#guide)');
  if (other) { other.addEventListener('close', () => $('guide').showModal(), {once:true}); other.close(); }
  else $('guide').showModal();
}
addEventListener('hashchange', openFallbackGuide);
openFallbackGuide();
try { const theme = localStorage.getItem('kpm-theme'); if (['light', 'dark'].includes(theme)) document.documentElement.dataset.theme = theme; } catch {}
$('theme').addEventListener('click', () => {
  const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme:dark)').matches;
  const theme = dark ? 'light' : 'dark'; document.documentElement.dataset.theme = theme;
  try { localStorage.setItem('kpm-theme', theme); } catch {}
});

try {
  const response = await fetch('site.json', { cache: 'no-cache' });
  if (!response.ok) throw new Error('目录暂不可用');
  const site = await response.json(), catalog = site.catalog;
  configureTheme(site.themeColor || DEFAULT_SEED);
  if (catalog.kind === 'RESOURCES') {
    document.getElementById('catalog-title').firstChild.textContent = '资源列表 ';
    document.querySelector('.add-heading span:last-child').textContent = '添加这个源';
    document.querySelector('.add-card').setAttribute('aria-label', '添加资源来源');
    document.querySelector('.scan-row img').alt = '手机扫码添加这个源';
    document.querySelector('.guide-steps li:last-child h3').textContent = '选择喜欢的内容';
    document.querySelector('.guide-steps li:last-child p').textContent = '在商店的资源页面浏览并添加。';
    $('search').placeholder = '搜索资源'; $('search').setAttribute('aria-label', '搜索资源');
    $('categories').setAttribute('aria-label', '资源分类');
  }
  document.title = `${catalog.name} · KPM`;
  $('source-name').textContent = catalog.name;
  $('source-icon').replaceChildren(icon(catalog.icon || { symbol: 'inventory_2' }, site));
  $('source-description').replaceChildren(markdown(catalog.description, site));
  $('source-readme').replaceChildren(...(catalog.readme ? [markdown(catalog.readme, site)] : []));
  const updated = new Date(catalog.updatedAt);
  $('publisher').textContent = site.publisher || catalog.name;
  if (!Number.isNaN(updated.getTime())) $('publisher').textContent += ` · 更新于 ${updated.toLocaleDateString('zh-CN')}`;
  $('count').textContent = catalog.packages.length;
  const sourceURL = safeURL(site.sourceUrl);
  if (!sourceURL.startsWith('https://')) throw new Error('源地址需为 HTTPS');
  const addURL = sourceLink(sourceURL);
  $('source-url').textContent = sourceURL; $('manual-url').textContent = sourceURL;
  $('add-source').href = addURL;
  $('add-source').removeAttribute('aria-disabled');
  $('source-code').href = safeURL(site.repository) || 'https://github.com/KIGTTS/KPM';
  $('download-app').href = safeURL(site.downloadURL) || 'https://github.com/KIGTTS/KIGTTSNEXT';
  $('copy-source').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(sourceURL); toast('源地址已复制'); }
    catch { $('guide').showModal(); const selection = getSelection(); const range = document.createRange(); range.selectNodeContents($('manual-url')); selection.removeAllRanges(); selection.addRange(range); toast('请复制已选中的源地址'); }
  });
  const resourceLabels = { QUICK_TEXT: '快捷文本', PHOTOS: '照片集', FILTER: '滤镜', VOICE: '语音包', FRAME: '照片边框', STICKERS: '贴纸包' };
  catalog.packages.forEach(item => { if (item.resourceType) item.category = resourceLabels[item.resourceType]; });
  let category = '', query = '', visibleLimit = 24;
  let loadObserver;
  function render(append = false) {
    const entries = [...catalog.packages].filter(item => (!category || item.category === category) && `${item.name} ${item.summary} ${(item.tags || []).join(' ')}`.toLowerCase().includes(query)).sort((a, b) => (a.category || '').localeCompare(b.category || '', 'zh') || a.name.localeCompare(b.name, 'zh') || a.id.localeCompare(b.id));
    const cards = entries.slice(append ? visibleLimit - 24 : 0, visibleLimit).map(item => {
      const card = node('button', 'package-card'); card.type = 'button'; card.setAttribute('aria-label', `查看 ${item.name}`);
      const top = node('div', 'package-top'), avatar = node('span', 'package-icon'); avatar.append(icon(item.icon, site));
      top.append(avatar, node('span', 'version', `v${latest(item)?.version || '—'}`));
      const bottom = node('div', 'package-bottom'); bottom.append(node('span', '', item.category || '扩展'), symbol('arrow_forward'));
      card.append(top, node('h3', '', item.name), node('p', 'package-summary', item.summary || ''), bottom); card.addEventListener('click', () => showDetail(item, site, sourceURL));
      return card;
    });
    if (loadObserver) loadObserver.disconnect();
    const sentinel = node('div', 'catalog-load-sentinel');
    sentinel.setAttribute('aria-hidden', 'true');
    $('packages').querySelector('.catalog-load-sentinel')?.remove();
    if (cards.length) {
      if (append) listMotion.append(cards); else listMotion.replace(cards);
      if (visibleLimit < entries.length) $('packages').append(sentinel);
      loadObserver = new IntersectionObserver(changes => {
        if (changes.some(change => change.isIntersecting) && visibleLimit < entries.length) {
          visibleLimit += 24;
          render(true);
        }
      }, { rootMargin: '360px' });
      if (visibleLimit < entries.length) loadObserver.observe(sentinel);
    } else {
      listMotion.clear();
      $('packages').replaceChildren(node('p', 'empty', catalog.packages.length ? '没有匹配的内容，试试其它关键词。' : '这个源还没有内容，稍后再来看看。'));
    }
    $('packages').setAttribute('aria-busy', 'false');
    $('count').textContent = query || category ? `${entries.length} / ${catalog.packages.length}` : catalog.packages.length;
  }
  const categories = [['', '全部'], ...[...new Set(catalog.packages.map(x => x.category || '扩展'))].sort().map(x => [x, x])];
  $('categories').replaceChildren(...categories.map(([value, title]) => {
    const button = node('button', 'category', title); button.setAttribute('aria-pressed', !value);
    button.addEventListener('click', () => { category = value; visibleLimit = 24; $('categories').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b === button)); render(); });
    return button;
  }));
  $('search').addEventListener('input', event => { query = event.target.value.trim().toLowerCase(); visibleLimit = 24; render(); });
  render();
} catch (error) {
  listMotion.clear(); $('packages').setAttribute('aria-busy', 'false');
  $('source-name').textContent = '暂时无法读取插件源';
  $('packages').replaceChildren(node('p', 'empty', '请检查网络连接，然后刷新页面重试。'));
  $('source-description').textContent = '暂时无法加载插件目录。';
  $('add-source').removeAttribute('href'); $('add-source').setAttribute('aria-disabled', 'true');
  console.error('KPM catalog load failed', error);
}
