/** Brief fairness-toggle flash when verified audit history becomes available. */
export function shouldFairnessPanelReadyEntryPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
