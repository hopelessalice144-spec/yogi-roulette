/** Brief refill-button flash when the free faucet becomes eligible. */
export function shouldFaucetReadyPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
