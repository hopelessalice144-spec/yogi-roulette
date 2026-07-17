/** Brief result-pill flash when awaiting first spin becomes actionable. */
export function shouldResultPillReadyPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
