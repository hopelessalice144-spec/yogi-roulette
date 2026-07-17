/** Brief cycle-track flash when final-seconds drop urgency begins. */
export function shouldCycleDropUrgencyEntryPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
