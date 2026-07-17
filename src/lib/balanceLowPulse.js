/** Brief wallet flash when balance drops below the minimum chip bet. */
export function shouldBalanceLowPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
