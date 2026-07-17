/** Brief mute-button flash when audio becomes newly muted. */
export function shouldAudioToggleReadyEntryPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
