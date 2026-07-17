/** Subtle payout-layer pulse while a win awaits number reveal. */
export function shouldPayoutToastReadyGlow(lastWin, displayNumber, particleBurst, shownBurst) {
  const win = Math.floor(Number(lastWin) || 0);
  if (win <= 0) return false;
  if (displayNumber != null) return false;
  const pending = Math.floor(Number(particleBurst) || 0);
  const shown = Math.floor(Number(shownBurst) || 0);
  return pending > shown;
}
