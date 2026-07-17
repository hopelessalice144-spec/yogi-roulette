/** Brief clear-button flash when refunding all bets becomes eligible. */
export function shouldClearReadyEntryPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
