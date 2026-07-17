/** Brief canvas rim flash when settle reveal glow becomes active. */
export function shouldSettleRimGlowEntryPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
