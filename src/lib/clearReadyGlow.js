/** Subtle clear-button pulse when staked chips can be refunded. */
export function shouldClearReadyGlow(bettingOpen, staked) {
  return bettingOpen === true && Math.floor(Number(staked) || 0) > 0;
}
