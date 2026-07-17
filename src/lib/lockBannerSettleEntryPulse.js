/** Brief lock-banner flash when the no-more-bets toast appears on betting close. */
export function shouldLockBannerSettleEntryPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
