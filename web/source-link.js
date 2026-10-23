// Android browsers can fall back to the guide without showing an unknown-scheme page.
export function sourceLink(sourceURL) {
  const query = `url=${encodeURIComponent(sourceURL)}`;
  const android = navigator.userAgentData?.platform === 'Android' || /Android/i.test(navigator.userAgent);
  // Edge handles the scheme through its own confirmation UI. Its intent handler
  // can choose the browser fallback even when the app is installed.
  if (!android || /EdgA\//.test(navigator.userAgent)) return `kigtts://source/add?${query}`;
  const fallback = new URL(location.href);
  fallback.hash = 'add-guide';
  return `intent://source/add?${query}#Intent;scheme=kigtts;package=com.kigtts.next;S.browser_fallback_url=${encodeURIComponent(fallback.href)};end`;
}

// A launch is always user initiated; never retry or auto-download in a timer.
document.addEventListener('click', event => {
  const link = event.target.closest('a[href^="kigtts:"]');
  if (!link) return;
  let leftPage = false;
  const onVisibility = () => {if (document.hidden) leftPage = true;};
  const onHide = () => {leftPage = true;};
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', onHide, {once:true});
  setTimeout(() => {
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', onHide);
    if (!leftPage && !document.hidden) location.hash = 'add-guide';
  }, 1800);
});
