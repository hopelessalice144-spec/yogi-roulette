/**
 * UI theme profiles — VIP lounge, retro neon, ultra-minimal daylight.
 */

export const UI_THEME_LOUNGE = 'lounge';
export const UI_THEME_NEON = 'neon';
export const UI_THEME_LIGHT = 'light';
export const UI_THEMES = Object.freeze([UI_THEME_LOUNGE, UI_THEME_NEON, UI_THEME_LIGHT]);
export const DEFAULT_UI_THEME = UI_THEME_LOUNGE;

const STORAGE_KEY = 'turboRoulette.uiTheme';

export function normalizeUiTheme(theme) {
  if (theme === UI_THEME_NEON) return UI_THEME_NEON;
  if (theme === UI_THEME_LIGHT) return UI_THEME_LIGHT;
  return UI_THEME_LOUNGE;
}

export function loadUiTheme() {
  if (typeof localStorage === 'undefined') return DEFAULT_UI_THEME;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return normalizeUiTheme(raw);
  } catch {
    return DEFAULT_UI_THEME;
  }
}

export function saveUiTheme(theme) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, normalizeUiTheme(theme));
  } catch {
    /* private mode */
  }
}

/** Browser chrome / PWA status bar tint per theme profile. */
export function themeColor(theme) {
  const normalized = normalizeUiTheme(theme);
  if (normalized === UI_THEME_NEON) return '#06040f';
  if (normalized === UI_THEME_LIGHT) return '#e8eef5';
  return '#0a0814';
}

/** Apply `data-theme` on the document root for CSS token overrides. */
export function applyUiTheme(theme) {
  if (typeof document === 'undefined' || !document.documentElement) return;
  const normalized = normalizeUiTheme(theme);
  document.documentElement.dataset.theme = normalized;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', themeColor(normalized));
}

/** Cycle lounge → neon → daylight → lounge. */
export function cycleUiTheme(theme) {
  const idx = UI_THEMES.indexOf(normalizeUiTheme(theme));
  return UI_THEMES[(idx + 1) % UI_THEMES.length];
}

/** @deprecated use cycleUiTheme */
export function toggleUiTheme(theme) {
  return cycleUiTheme(theme);
}

export function themeLabel(theme) {
  const normalized = normalizeUiTheme(theme);
  if (normalized === UI_THEME_NEON) return 'Neon';
  if (normalized === UI_THEME_LIGHT) return 'Daylight';
  return 'Lounge';
}

export function themeSubtitle(theme) {
  const normalized = normalizeUiTheme(theme);
  if (normalized === UI_THEME_NEON) return 'Neon Casino · Retro Edition';
  if (normalized === UI_THEME_LIGHT) return 'Daylight Lounge · Minimal Edition';
  return 'VIP Lounge · Web3 Edition';
}
