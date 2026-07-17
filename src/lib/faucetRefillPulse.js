/** Trigger wallet glow when faucet refill was claimed. */
export function shouldFaucetRefillPulse(claimed, amount) {
  return claimed === true && Math.floor(Number(amount) || 0) > 0;
}
