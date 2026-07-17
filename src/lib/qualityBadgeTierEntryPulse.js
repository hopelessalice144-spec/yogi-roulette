const TIER_RANK = { low: 0, medium: 1, high: 2 };

/** True when adaptive quality tier steps up (low→medium, medium→high). */
export function shouldQualityBadgeTierEntryPulse(prevTier, nextTier) {
  return (TIER_RANK[nextTier] ?? 0) > (TIER_RANK[prevTier] ?? 0);
}
