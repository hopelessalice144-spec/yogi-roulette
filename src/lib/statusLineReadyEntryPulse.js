/** Brief status-line flash when the betting window opens. */
export function shouldStatusLineReadyEntryPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
