/** Brief custody-badge flash when verified audit history becomes available. */
export function shouldFairnessCustodyBadgeReadyEntryPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
