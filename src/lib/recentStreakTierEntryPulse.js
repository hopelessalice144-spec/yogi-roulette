import { shouldRecentStreakTierPulse } from './recentStreakTierPulse.js';

/** Brief badge flash when recent color-streak tier steps up (non-hot uses warm entry). */
export function shouldRecentStreakTierEntryPulse(prevTier, nextTier) {
  return shouldRecentStreakTierPulse(prevTier, nextTier);
}
