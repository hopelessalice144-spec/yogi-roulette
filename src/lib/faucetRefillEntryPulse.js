/** Trigger wallet glow when faucet refill was claimed. */
export function shouldFaucetRefillEntryPulse(claimed, amount) {
  return claimed === true && Math.floor(Number(amount) || 0) > 0;
}
