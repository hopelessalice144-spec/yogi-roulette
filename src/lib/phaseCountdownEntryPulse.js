/** Brief countdown-ring flash when the bet lock ring first appears. */
export function shouldPhaseCountdownEntryPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
