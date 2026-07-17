/** Brief result pill flash when winning number reveals during settle. */
export function shouldResultPillRevealEntryPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
