/** Brief pending-glow flash when a win is queued before number reveal. */
export function shouldPayoutToastPendingReadyPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
