/** Subtle stats-toggle pulse when session round history is available. */
export function shouldStatsPanelReadyGlow(rounds, expanded = false) {
  if (expanded === true) return false;
  return Array.isArray(rounds) && rounds.length > 0;
}
