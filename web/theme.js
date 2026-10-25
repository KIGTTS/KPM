import { argbFromHex, hexFromArgb, Hct, SchemeTonalSpot, MaterialDynamicColors } from './vendor/material-colors.js';

export const DEFAULT_SEED = '#00696e';
const roles = new MaterialDynamicColors();
export function themeTokens(seed = DEFAULT_SEED) {
  if (!/^#[0-9a-fA-F]{6}$/.test(seed)) throw new Error('themeColor must be #RRGGBB');
  return Object.fromEntries(['light', 'dark'].map(mode => {
    // Match Android's default theme, including the 2025 phone color specification.
    const scheme = new SchemeTonalSpot(Hct.fromInt(argbFromHex(seed)), mode === 'dark', 0, '2025', 'phone');
    const colors = Object.fromEntries([...roles.allColors, roles.surfaceVariant(), roles.shadow(), roles.scrim(), roles.surfaceTint()]
      .map(role => ['--md-sys-color-' + role.name.replaceAll('_', '-'), hexFromArgb(role.getArgb(scheme))]));
    const color = name => colors['--md-sys-color-' + name];
    return [mode, {...colors, '--bg': color('background'), '--surface': color('surface-container'),
      '--card': color('surface-container-low'), '--primary': color('primary'), '--on-primary': color('on-primary'),
      '--accent': color('primary-container'), '--text': color('on-surface'), '--muted': color('on-surface-variant'),
      '--line': color('outline-variant'), '--shadow': `0 12px 40px ${color('shadow')}18`}];
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
