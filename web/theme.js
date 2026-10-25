import { argbFromHex, hexFromArgb, themeFromSourceColor } from './vendor/material-colors.js';

const cssName = key => key.replace(/[A-Z]/g, c => '-' + c.toLowerCase());
export function themeTokens(seed = '#038387') {
  if (!/^#[0-9a-fA-F]{6}$/.test(seed)) throw new Error('themeColor must be #RRGGBB');
  const theme = themeFromSourceColor(argbFromHex(seed));
  return Object.fromEntries(['light', 'dark'].map(mode => {
    const dark = mode === 'dark', scheme = theme.schemes[mode].toJSON();
    const colors = Object.fromEntries(Object.entries(scheme).map(([key, value]) => ['--md-sys-color-' + cssName(key), hexFromArgb(value)]));
    const tone = (palette, value) => hexFromArgb(theme.palettes[palette].tone(value));
    return [mode, {...colors, '--bg': tone('neutral', dark ? 6 : 98), '--surface': tone('neutral', dark ? 12 : 94),
      '--card': tone('neutral', dark ? 10 : 100), '--primary': hexFromArgb(scheme.primary), '--on-primary': hexFromArgb(scheme.onPrimary),
      '--accent': hexFromArgb(scheme.primaryContainer), '--text': hexFromArgb(scheme.onSurface), '--muted': hexFromArgb(scheme.onSurfaceVariant),
      '--line': tone('neutralVariant', dark ? 30 : 80), '--shadow': `0 12px 40px ${tone('neutral', dark ? 0 : 20)}18`}];
  }));
}

export function configureTheme(seed) {
  const tokens = themeTokens(seed), declarations = mode => Object.entries(tokens[mode]).map(([key, value]) => `${key}:${value}`).join(';');
  const style = document.createElement('style'); style.id = 'kpm-seed-theme';
  style.textContent = `:root,:root[data-theme=light]{${declarations('light')}}@media(prefers-color-scheme:dark){:root:not([data-theme=light]){${declarations('dark')}}}:root[data-theme=dark]{${declarations('dark')}}dialog::backdrop{background:color-mix(in srgb,var(--text) 50%,transparent)}`;
  document.getElementById(style.id)?.remove(); document.head.append(style);
  const update = () => {
    const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme:dark)').matches;
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', tokens[dark ? 'dark' : 'light']['--bg']);
  };
  new MutationObserver(update).observe(document.documentElement, {attributes:true,attributeFilter:['data-theme']});
  matchMedia('(prefers-color-scheme:dark)').addEventListener('change', update); update();
}
