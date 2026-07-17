/** Warm panel-header bloom when the winning number is revealed. */
export function shouldSettleRevealHeaderBloom(displayNumber, hudPhase) {
  return displayNumber != null && hudPhase === 'settle-reveal';
}

/** Effect key so each result replays the header bloom once. */
export function settleRevealHeaderBloomKey(displayNumber, hudPhase) {
  if (!shouldSettleRevealHeaderBloom(displayNumber, hudPhase)) return null;
  return `header-bloom-${displayNumber}`;
}
