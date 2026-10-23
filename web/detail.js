import { node, markdown, compareVersions, safeURL, symbol } from './data.js';
import { sourceLink } from './source-link.js';

export function showDetail(item, site, sourceURL) {
  document.getElementById('detail-category').textContent = item.category || '扩展';
  document.getElementById('detail-name').textContent = item.name;
  const body = document.getElementById('detail-body');
  body.replaceChildren(markdown(item.description || item.summary, site));
  const gallery = node('div', 'gallery');
  for (const id of item.thumbnails || []) {
    if (!site.art?.[id]) continue;
    const figure = node('figure'), image = node('img'), alt = site.catalog.assets?.[id]?.alt || '';
    image.src = site.art[id]; image.alt = alt; image.loading = 'lazy';
    figure.append(image, node('figcaption', '', alt)); gallery.append(figure);
  }
  if (gallery.children.length) body.append(gallery);
  const meta = node('div', 'release-meta');
  for (const text of [item.license, item.id]) if (text) meta.append(node('span', '', text));
  const more = node('details'), moreTitle = node('summary', '', '更多信息');
  more.append(moreTitle, meta);
  body.append(more, node('h3', 'release-heading', '版本与更新'));
  for (const [index, release] of [...item.releases].sort(compareVersions).entries()) {
    const details = node('details'), summary = node('summary', '', `v${release.version}`);
    if (index === 0) details.open = true;
    const info = node('div', 'release-meta');
    const androidVersions = {26:'8.0',27:'8.1',28:'9',29:'10',30:'11',31:'12',32:'12L',33:'13',34:'14',35:'15',36:'16'};
    const sdk = release.minSdk || 26;
    const android = androidVersions[sdk] ? `Android ${androidVersions[sdk]} 及以上` : `Android API ${sdk} 及以上`;
    const format = {NATIVE:'原生插件',LUA:'Lua 插件'}[release.format] || release.format;
    for (const value of [`插件 API ${release.apiVersion || 9}+`, android, format].filter(Boolean)) info.append(node('span', '', value));
    const compatibility = node('details');
    compatibility.append(node('summary', '', '兼容性'), info);
    details.append(summary, markdown(release.notes || '暂无更新说明。', site), compatibility);
    if (Object.keys(release.dependencies || {}).length) {
      const list = node('ul');
      for (const [id, range] of Object.entries(release.dependencies)) {
        const name = site.catalog.packages.find(pkg => pkg.id === id)?.name || id;
        list.append(node('li', '', `${name} · ${range}`));
      }
      details.append(node('h4', '', '所需插件'), list);
    }
    body.append(details);
  }
  const homepage = safeURL(item.homepage);
  if (homepage) { const link = node('a', 'text-button', '项目主页 ↗'); link.href = homepage; body.append(link); }
  document.getElementById('detail-add').href = sourceLink(sourceURL, item.id);
  document.getElementById('detail').showModal();
}
