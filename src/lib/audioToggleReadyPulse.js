/** Brief mute-button flash when audio becomes newly muted. */
export function shouldAudioToggleReadyPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
