/** Brief header flash when at-risk stake warning becomes active. */
export function shouldStakeRiskWarningEntryPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
