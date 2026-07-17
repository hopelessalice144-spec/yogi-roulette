/** Brief fairness-toggle flash when verified audit history becomes available. */
export function shouldFairnessPanelReadyPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
