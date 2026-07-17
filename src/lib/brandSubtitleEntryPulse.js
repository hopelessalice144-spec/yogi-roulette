/** Brief brand-subtitle flash when the UI theme changes. */
export function shouldBrandSubtitleEntryPulse(prevTheme, nextTheme) {
  return Boolean(prevTheme) && Boolean(nextTheme) && prevTheme !== nextTheme;
}
