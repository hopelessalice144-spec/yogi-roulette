/** Subtle result-pill pulse before the first spin of the session. */
export function shouldResultPillReadyGlow(displayNumber, recentResults = []) {
  if (displayNumber != null) return false;
  return !Array.isArray(recentResults) || recentResults.length === 0;
}
