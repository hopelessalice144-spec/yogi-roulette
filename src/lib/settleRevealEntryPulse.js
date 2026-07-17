/** Brief panel flash when betting board enters settle-reveal. */
export function shouldSettleRevealEntryPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
