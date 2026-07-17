/** Brief save-button flash when preset save becomes eligible. */
export function shouldSavePresetReadyPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
