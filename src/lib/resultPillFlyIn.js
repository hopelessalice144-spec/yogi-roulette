/** Play fly-in when the winning number lands during settle reveal. */
export function shouldResultPillFlyIn(displayNumber, hudPhase) {
  return displayNumber != null && hudPhase === 'settle-reveal';
}

/** Remount key so each new result replays the fly-in. */
export function resultPillRevealKey(displayNumber, hudPhase) {
  if (!shouldResultPillFlyIn(displayNumber, hudPhase)) return 'awaiting';
  return `reveal-${displayNumber}`;
}
