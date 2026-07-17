/** Brief wallet flash when balance drops below the minimum chip bet. */
export function shouldBalanceLowEntryPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
