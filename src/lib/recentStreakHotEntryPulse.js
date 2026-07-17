/** Brief streak-chip flash when recent color streak enters hot tier from warm. */
export function shouldRecentStreakHotEntryPulse(prevTier, nextTier) {
  return prevTier === 'warm' && nextTier === 'hot';
}
