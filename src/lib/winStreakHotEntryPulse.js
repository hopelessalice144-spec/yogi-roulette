/** Brief badge flash when win streak enters hot tier from warm. */
export function shouldWinStreakHotEntryPulse(prevTier, nextTier) {
  return prevTier === 'warm' && nextTier === 'hot';
}
