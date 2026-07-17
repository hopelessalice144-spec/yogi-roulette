/** Brief lock-phase pill flash when the no-more-bets window opens. */
export function shouldLockPhasePillUrgencyPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
