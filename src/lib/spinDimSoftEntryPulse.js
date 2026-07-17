/** Brief panel flash when betting board enters soft spin dim. */
export function shouldSpinDimSoftEntryPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
