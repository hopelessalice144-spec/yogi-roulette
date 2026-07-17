const TIER_RANK = { none: 0, warm: 1, hot: 2 };

/** True when the recent color-streak chip tier steps up (none→warm, warm→hot). */
export function shouldRecentStreakTierPulse(prevTier, nextTier) {
  return (TIER_RANK[nextTier] ?? 0) > (TIER_RANK[prevTier] ?? 0);
}
