/** Brief status-line flash when the betting window opens. */
export function shouldStatusLineReadyPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
