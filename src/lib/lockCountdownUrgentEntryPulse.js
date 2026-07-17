/** Brief countdown-ring flash when the bet lock window enters urgent seconds. */
export function shouldLockCountdownUrgentEntryPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
