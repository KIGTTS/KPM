const messages = {
  'zh-CN': {
    language:'语言', home:'KPM 首页', navigation:'页面导航', guide:'添加指引', source:'模板与源码', theme:'切换亮暗主题',
    loading:'正在读取插件源', loadingList:'正在加载插件列表', loadingAddress:'正在读取地址…',
    addLabel:'添加插件源', addHeading:'添加这个插件源', add:'添加到 KPM', copy:'复制源地址', scan:'手机扫码添加这个插件源',
    desktop:'电脑上浏览？', scanAdd:'手机扫码添加', manual:'手动添加指引', noApp:'还没有 KIGTTS？', download:'下载 KIGTTS',
    catalog:'插件列表', search:'搜索插件', categories:'插件分类', intro:'插件源介绍', create:'创建自己的插件源 ↗',
    closeGuide:'关闭指引', guide1:'安装 KIGTTS 与插件商店', guide1Body:'先在手机上安装 KIGTTS。尚未安装插件商店时，软件会引导安装。',
    guide2:'点击“添加到 KPM”', guide2Body:'打开 KIGTTS 后确认添加。在电脑上浏览时，可用手机扫描二维码。',
    guide3:'选择你喜欢的插件', guide3Body:'在插件商店浏览并安装需要的插件。',
    manualTitle:'浏览器没有打开软件？', manualBody:'复制源地址，在「插件商店 → 设置 → 插件来源 → 添加源」中粘贴。',
    closeDetail:'关闭插件详情', detail:'插件详细信息', openApp:'在 KIGTTS 中查看', updated:'更新于 {date}', copied:'源地址已复制',
    copyManual:'请复制已选中的源地址', all:'全部', view:'查看 {name}', extensions:'扩展', noMatches:'没有匹配的内容，试试其它关键词。',
    noContent:'这个源还没有内容，稍后再来看看。', error:'暂时无法读取插件源', retry:'请检查网络连接，然后刷新页面重试。',
    errorBody:'暂时无法加载插件目录。', more:'更多信息', versions:'版本与更新', android:'Android {version} 及以上',
    native:'原生插件', lua:'Lua 插件', resource:'资源包', compatibility:'兼容性', noNotes:'暂无更新说明。',
    dependencies:'所需插件', homepage:'项目主页 ↗', preview:'图片预览', gallery:'{name}图片预览', scrollImages:'滚动查看图片',
    enlarge:'放大预览：{name}', previous:'上一张图片', next:'下一张图片', closePreview:'关闭图片预览', swipeImages:'左右滑动查看图片',
    resourceCatalog:'资源列表', resourceSearch:'搜索资源', resourceCategories:'资源分类', resourceAdd:'添加资源来源', resourceHeading:'添加这个源',
    resourceScan:'手机扫码添加这个源', resourceGuide:'选择喜欢的内容', resourceGuideBody:'在商店的资源页面浏览并添加。'
  },
  en: {
    language:'Language', home:'KPM home', navigation:'Site navigation', guide:'Add a source', source:'Template and source code', theme:'Toggle light or dark theme',
    loading:'Loading the plugin source', loadingList:'Loading plugins', loadingAddress:'Loading the source address…',
    addLabel:'Add plugin source', addHeading:'Add this plugin source', add:'Add to KPM', copy:'Copy source address', scan:'Scan with your phone to add this plugin source',
    desktop:'On a computer?', scanAdd:'Scan with your phone', manual:'Add manually', noApp:'New to KIGTTS?', download:'Download KIGTTS',
    catalog:'Plugins', search:'Search plugins', categories:'Plugin categories', intro:'About this plugin source', create:'Create your own plugin source ↗',
    closeGuide:'Close instructions', guide1:'Install KIGTTS and the plugin store', guide1Body:'Install KIGTTS on your phone first. If you do not have the plugin store, KIGTTS will guide you through installing it.',
    guide2:'Select “Add to KPM”', guide2Body:'Confirm after KIGTTS opens. On a computer, scan the QR code with your phone.',
    guide3:'Choose your plugins', guide3Body:'Browse and install plugins in the plugin store.',
    manualTitle:'Did the browser fail to open KIGTTS?', manualBody:'Copy the source address and paste it under Plugin Store → Settings → Sources → Add source.',
    closeDetail:'Close plugin details', detail:'Plugin details', openApp:'View in KIGTTS', updated:'Updated {date}', copied:'Source address copied',
    copyManual:'Copy the selected source address', all:'All', view:'View {name}', extensions:'Extensions', noMatches:'No matches. Try different search terms.',
    noContent:'This source has no items yet.', error:'Unable to load this plugin source', retry:'Check your connection and refresh to retry.',
    errorBody:'The plugin catalog could not be loaded.', more:'More information', versions:'Versions and updates', android:'Android {version} or later',
    native:'Native plugin', lua:'Lua plugin', resource:'Resource pack', compatibility:'Compatibility', noNotes:'No release notes yet.',
    dependencies:'Required plugins', homepage:'Project website ↗', preview:'Image preview', gallery:'{name} image previews', scrollImages:'Scroll through images',
    enlarge:'Enlarge preview: {name}', previous:'Previous image', next:'Next image', closePreview:'Close image preview', swipeImages:'Swipe left or right to view images',
    resourceCatalog:'Resources', resourceSearch:'Search resources', resourceCategories:'Resource categories', resourceAdd:'Add resource source', resourceHeading:'Add this source',
    resourceScan:'Scan with your phone to add this source', resourceGuide:'Choose your resources', resourceGuideBody:'Browse and add items in the store’s Resources section.'
  },
  ko: {
    language:'언어', home:'KPM 홈', navigation:'페이지 탐색', guide:'소스 추가 안내', source:'템플릿 및 소스 코드', theme:'라이트·다크 테마 전환',
    loading:'플러그인 소스 불러오는 중', loadingList:'플러그인 목록 불러오는 중', loadingAddress:'소스 주소 불러오는 중…',
    addLabel:'플러그인 소스 추가', addHeading:'이 플러그인 소스 추가', add:'KPM에 추가', copy:'소스 주소 복사', scan:'휴대전화로 스캔하여 플러그인 소스 추가',
    desktop:'컴퓨터에서 보고 있나요?', scanAdd:'휴대전화로 스캔해 추가', manual:'직접 추가하기', noApp:'KIGTTS가 없나요?', download:'KIGTTS 다운로드',
    catalog:'플러그인 목록', search:'플러그인 검색', categories:'플러그인 카테고리', intro:'플러그인 소스 소개', create:'나만의 플러그인 소스 만들기 ↗',
    closeGuide:'안내 닫기', guide1:'KIGTTS와 플러그인 스토어 설치', guide1Body:'먼저 휴대전화에 KIGTTS를 설치하세요. 플러그인 스토어가 없으면 앱에서 설치를 안내합니다.',
    guide2:'‘KPM에 추가’ 선택', guide2Body:'KIGTTS가 열리면 소스 추가를 확인하세요. 컴퓨터에서는 휴대전화로 QR 코드를 스캔하세요.',
    guide3:'원하는 플러그인 선택', guide3Body:'플러그인 스토어에서 필요한 플러그인을 찾아 설치하세요.',
    manualTitle:'브라우저에서 KIGTTS가 열리지 않나요?', manualBody:'소스 주소를 복사한 다음 플러그인 스토어 → 설정 → 소스 → 소스 추가에 붙여넣으세요.',
    closeDetail:'플러그인 상세 닫기', detail:'플러그인 상세 정보', openApp:'KIGTTS에서 보기', updated:'업데이트: {date}', copied:'소스 주소를 복사했습니다',
    copyManual:'선택한 소스 주소를 복사하세요', all:'전체', view:'{name} 보기', extensions:'확장 기능', noMatches:'검색 결과가 없습니다. 다른 검색어로 시도하세요.',
    noContent:'이 소스에는 아직 항목이 없습니다.', error:'플러그인 소스를 불러올 수 없습니다', retry:'네트워크를 확인한 뒤 페이지를 새로고침하세요.',
    errorBody:'플러그인 카탈로그를 불러오지 못했습니다.', more:'추가 정보', versions:'버전 및 업데이트', android:'Android {version} 이상',
    native:'네이티브 플러그인', lua:'Lua 플러그인', resource:'리소스 팩', compatibility:'호환성', noNotes:'업데이트 안내가 없습니다.',
    dependencies:'필수 플러그인', homepage:'프로젝트 홈페이지 ↗', preview:'이미지 미리보기', gallery:'{name} 이미지 미리보기', scrollImages:'스크롤하여 이미지 보기',
    enlarge:'미리보기 확대: {name}', previous:'이전 이미지', next:'다음 이미지', closePreview:'이미지 미리보기 닫기', swipeImages:'좌우로 밀어 이미지 보기',
    resourceCatalog:'리소스 목록', resourceSearch:'리소스 검색', resourceCategories:'리소스 카테고리', resourceAdd:'리소스 소스 추가', resourceHeading:'이 소스 추가',
    resourceScan:'휴대전화로 스캔하여 이 소스 추가', resourceGuide:'원하는 리소스 선택', resourceGuideBody:'스토어의 리소스 화면에서 항목을 찾아 추가하세요.'
  }
};

const categoryNames = {
  '音频':['Audio','오디오'], '工具':['Tools','도구'], '界面':['Interface','인터페이스'],
  '外观':['Appearance','모양'], '输入':['Input','입력'],
  '内容':['Content','콘텐츠'], '资源':['Resources','리소스'], '扩展':['Extensions','확장 기능'],
  '快捷文本':['Quick phrases','빠른 문구'], '照片集':['Photo collections','사진 모음'],
  '滤镜':['Filters','필터'], '语音包':['Voice packs','음성 팩'], '照片边框':['Photo frames','사진 프레임'],
  '名片边框':['Profile frames','프로필 프레임'], '字体':['Fonts','글꼴'], '贴纸包':['Stickers','스티커'],
  '字幕':['Captions','자막'], '兼容':['Compatibility','호환성'], '开发':['Development','개발'],
  '备份':['Backups','백업'], '辅助':['Accessibility','접근성']
};

function normalize(raw) {
  const tag = raw?.toLowerCase().split('-')[0];
  return ({zh:'zh-CN',en:'en',ko:'ko'})[tag] || null;
}
let saved;
try { saved = localStorage.getItem('kpm-language'); } catch {}
export let locale = normalize(new URLSearchParams(location.search).get('lang')) || normalize(saved) ||
  navigator.languages.map(normalize).find(Boolean) || 'zh-CN';
export const t = (key, args = {}) => (messages[locale][key] || messages['zh-CN'][key] || key)
  .replace(/\{(\w+)\}/g, (match, name) => String(args[name] ?? match));
export const categoryName = name => categoryNames[name]?.[locale === 'en' ? 0 : locale === 'ko' ? 1 : -1] || name || t('extensions');

export function localized(record) {
  const variants = record.localizations || {};
  const candidates = Object.keys(variants);
  const key = candidates.find(tag => tag.toLowerCase() === locale.toLowerCase()) ||
    candidates.find(tag => normalize(tag) === locale);
  return key ? {...record, ...variants[key]} : record;
}

export function setupLanguage(onChange = () => {}) {
  const select = document.getElementById('language');
  function update() {
    document.documentElement.lang = locale;
    select.value = locale;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    for (const attr of ['aria-label', 'title', 'alt', 'placeholder']) {
      const key = 'data-i18n-' + attr;
      document.querySelectorAll('[' + key + ']').forEach(el => el.setAttribute(attr,t(el.getAttribute(key))));
    }
  }
  update();
  select.addEventListener('change', () => {
    locale = normalize(select.value) || 'zh-CN';
    try { localStorage.setItem('kpm-language', locale); } catch {}
    const url = new URL(location.href);
    url.searchParams.set('lang', locale);
    history.replaceState(null, '', url);
    update();
    onChange();
  });
}
