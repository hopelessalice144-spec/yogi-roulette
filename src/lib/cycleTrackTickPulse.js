/** Brief cycle-track flash when the live cycle second ticks. */
export function shouldCycleTrackTickPulse(prevSecond, nextSecond) {
  const prev = Math.floor(Number(prevSecond) || 0);
  const next = Math.floor(Number(nextSecond) || 0);
  return prev !== next;
}
