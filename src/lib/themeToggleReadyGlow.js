/** Subtle theme-button pulse once session round history exists. */
export function shouldThemeToggleReadyGlow(sessionRounds = []) {
  return Array.isArray(sessionRounds) && sessionRounds.length > 0;
}
