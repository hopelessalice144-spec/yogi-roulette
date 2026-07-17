/** Brief refill-button flash when the free faucet becomes eligible. */
export function shouldFaucetReadyEntryPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
