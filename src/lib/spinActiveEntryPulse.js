/** Brief canvas flash when the live spin ring becomes active. */
export function shouldSpinActiveEntryPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
