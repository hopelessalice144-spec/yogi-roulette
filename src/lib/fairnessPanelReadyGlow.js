/** Subtle fairness-toggle pulse when verified audit history is available. */
export function shouldFairnessPanelReadyGlow(history, expanded = false) {
  if (expanded === true) return false;
  return Array.isArray(history) && history.length > 0;
}
