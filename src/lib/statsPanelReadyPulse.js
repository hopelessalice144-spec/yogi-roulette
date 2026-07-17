/** Brief stats-toggle flash when session round history becomes available. */
export function shouldStatsPanelReadyPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
