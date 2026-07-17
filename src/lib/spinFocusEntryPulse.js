/** Brief panel flash when betting board enters spin-focus dim. */
export function shouldSpinFocusEntryPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
