/** Brief favorites-toggle flash when saved presets become available. */
export function shouldFavoritesPanelReadyPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
