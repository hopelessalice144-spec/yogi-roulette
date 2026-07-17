/** Warm rim pulse when the winning number is revealed on the canvas. */
export function shouldSettleRimGlow(hudPhase, displayNumber) {
  return hudPhase === 'settle-reveal' && displayNumber != null;
}

/** Remount key so each result replays the rim pulse. */
export function settleRimGlowKey(displayNumber, hudPhase) {
  if (!shouldSettleRimGlow(hudPhase, displayNumber)) return null;
  return `rim-${displayNumber}`;
}
