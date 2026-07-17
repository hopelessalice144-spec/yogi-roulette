/** Brief favorites-toggle flash when saved presets become available. */
export function shouldFavoritesPanelReadyEntryPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
