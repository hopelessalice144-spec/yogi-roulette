/** Brief stats-toggle flash when session round history becomes available. */
export function shouldStatsPanelReadyEntryPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
