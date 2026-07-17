/** Brief staked-label flash when at-risk stake warning becomes active. */
export function shouldStakeRiskEntryPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
