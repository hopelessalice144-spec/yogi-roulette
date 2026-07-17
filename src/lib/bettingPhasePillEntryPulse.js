/** Brief betting-phase pill flash when the betting window opens. */
export function shouldBettingPhasePillEntryPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
