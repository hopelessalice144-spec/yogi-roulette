/** Brief brand-subtitle flash when the UI theme changes. */
export function shouldBrandSubtitlePulse(prevTheme, nextTheme) {
  return Boolean(prevTheme) && Boolean(nextTheme) && prevTheme !== nextTheme;
}
