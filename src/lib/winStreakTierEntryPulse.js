import { shouldWinStreakTierPulse } from './winStreakTierPulse.js';

/** Brief badge flash when win streak tier steps up (non-hot uses mild/warm entry). */
export function shouldWinStreakTierEntryPulse(prevTier, nextTier) {
  return shouldWinStreakTierPulse(prevTier, nextTier);
}
