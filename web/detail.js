import { node, markdown, compareVersions, safeURL, symbol } from './data.js';

export function showDetail(item, site, addURL) {
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
  body.append(meta, node('h3', 'release-heading', '版本与更新'));
  for (const [index, release] of [...item.releases].sort(compareVersions).entries()) {
    const details = node('details'), summary = node('summary', '', `v${release.version}`);
    if (index === 0) details.open = true;
    const info = node('div', 'release-meta');
    for (const value of [`API ${release.apiVersion || 9}+`, `Android ${release.minSdk || 26}+`, release.format]) info.append(node('span', '', value));
    details.append(summary, info, markdown(release.notes || '暂无版本说明。', site));
    if (Object.keys(release.dependencies || {}).length) {
      const list = node('ul');
      for (const [id, range] of Object.entries(release.dependencies)) list.append(node('li', '', `${id} · ${range}`));
      details.append(node('h4', '', '前置依赖'), list);
    }
    body.append(details);
  }
  const homepage = safeURL(item.homepage);
  if (homepage) { const link = node('a', 'text-button', '项目主页 ↗'); link.href = homepage; body.append(link); }
  document.getElementById('detail-add').href = addURL;
  document.getElementById('detail').showModal();
}
