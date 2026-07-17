const TIER_RANK = { none: 0, mild: 1, warm: 2, hot: 3 };

/** Win-streak HUD tier from consecutive winning round count. */
export function winStreakTier(streakLength) {
  if (streakLength < 2) return 'none';
  if (streakLength >= 5) return 'hot';
  if (streakLength >= 3) return 'warm';
  return 'mild';
}

/** True when the streak badge tier steps up (none→mild, mild→warm, warm→hot). */
export function shouldWinStreakTierPulse(prevTier, nextTier) {
  return (TIER_RANK[nextTier] ?? 0) > (TIER_RANK[prevTier] ?? 0);
}
