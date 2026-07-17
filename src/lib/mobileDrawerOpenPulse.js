/** Brief drawer-tab flash when the collapsed mobile panel becomes actionable. */
export function shouldMobileDrawerOpenPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
