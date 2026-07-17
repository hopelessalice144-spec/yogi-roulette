/** Trigger panel shake when clearing staked chips back to balance. */
export function shouldBetClearShake(refund) {
  return Math.floor(Number(refund) || 0) > 0;
}
