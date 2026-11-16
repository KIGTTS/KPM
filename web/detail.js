import { node, markdown, compareVersions, safeURL, symbol, icon } from './data.js';
import { sourceLink } from './source-link.js';
import { createPreviewGallery } from './preview-gallery.js';
import { categoryName, localized, t } from './i18n.js';

export function showDetail(item, site, sourceURL) {
  document.getElementById('detail-category').textContent = categoryName(item.category);
  document.getElementById('detail-name').textContent = item.name;
  document.getElementById('detail-icon').replaceChildren(icon(item.icon || {symbol:'extension'}, site));
  document.getElementById('detail-summary').textContent = item.summary || '';
  const body = document.getElementById('detail-body');
  body.querySelector('.preview-gallery')?.dispose();
  body.replaceChildren(...(item.description ? [markdown(item.description, site)] : []));
  document.querySelector('#detail .close-dialog').setAttribute('aria-label', t('closeDetail'));
  body.setAttribute('aria-label', t('detail'));
  const gallery = createPreviewGallery(item, site);
  if (gallery) body.append(gallery);
  const meta = node('div', 'release-meta');
  for (const text of [item.license, item.id]) if (text) meta.append(node('span', '', text));
  const more = node('details'), moreTitle = node('summary', '', t('more'));
  more.append(moreTitle, meta);
  body.append(more, node('h3', 'release-heading', t('versions')));
  for (const [index, release] of [...item.releases].sort(compareVersions).entries()) {
    const details = node('details'), summary = node('summary', '', `v${release.version}`);
    if (index === 0) details.open = true;
    const info = node('div', 'release-meta');
    const androidVersions = {26:'8.0',27:'8.1',28:'9',29:'10',30:'11',31:'12',32:'12L',33:'13',34:'14',35:'15',36:'16'};
    const sdk = release.minSdk || 26;
    const android = t('android',{version:androidVersions[sdk] || `API ${sdk}`});
    const formatKey = {NATIVE:'native',LUA:'lua',RESOURCE:'resource'}[release.format];
    const format = formatKey ? t(formatKey) : release.format;
    for (const value of [`KIGTTS API ${release.apiVersion || 9}+`, android, format].filter(Boolean)) info.append(node('span', '', value));
    const compatibility = node('details');
    compatibility.append(node('summary', '', t('compatibility')), info);
    details.append(summary, markdown(release.notes || t('noNotes'), site), compatibility);
    if (Object.keys(release.dependencies || {}).length) {
      const list = node('ul');
      for (const [id, range] of Object.entries(release.dependencies)) {
        const pkg = site.catalog.packages.find(pkg => pkg.id === id);
        const name = pkg ? localized(pkg).name : id;
        list.append(node('li', '', `${name} · ${range}`));
      }
      details.append(node('h4', '', t('dependencies')), list);
    }
    body.append(details);
  }
  const homepage = safeURL(item.homepage);
  if (homepage) { const link = node('a', 'text-button', t('homepage')); link.href = homepage; body.append(link); }
  document.getElementById('detail-add').href = sourceLink(sourceURL, item.id, site.catalog.linkPolicy);
  const dialog = document.getElementById('detail');
  if (!dialog.open) dialog.showModal();
  body.scrollTop = 0;
}
