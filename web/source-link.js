// Android browsers can fall back to the guide without showing an unknown-scheme page.
export function sourceLink(sourceURL) {
  const query = `url=${encodeURIComponent(sourceURL)}`;
  const android = navigator.userAgentData?.platform === 'Android' || /Android/i.test(navigator.userAgent);
  if (!android) return `kigtts://source/add?${query}`;
  const fallback = new URL(location.href);
  fallback.hash = 'add-guide';
  return `intent://source/add?${query}#Intent;scheme=kigtts;S.browser_fallback_url=${encodeURIComponent(fallback.href)};end`;
}
