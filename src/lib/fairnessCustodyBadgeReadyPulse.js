/** Brief custody-badge flash when verified audit history becomes available. */
export function shouldFairnessCustodyBadgeReadyPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
