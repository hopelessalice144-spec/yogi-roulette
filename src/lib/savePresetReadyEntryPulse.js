/** Brief save-button flash when preset save becomes eligible. */
export function shouldSavePresetReadyEntryPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
