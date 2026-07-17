/** Brief lock-banner flash when the no-more-bets toast becomes visible. */
export function shouldLockBannerReadyPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
