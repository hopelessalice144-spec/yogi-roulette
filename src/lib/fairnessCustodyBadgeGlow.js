/** Subtle custody-badge pulse when verified audit history is available. */
export function shouldFairnessCustodyBadgeGlow(history, custodyBadge, expanded = false) {
  if (expanded === true) return false;
  if (!custodyBadge) return false;
  return Array.isArray(history) && history.length > 0;
}
