/** Subtle mute-button pulse while audio and haptics are muted. */
export function shouldAudioToggleReadyGlow(audioMuted) {
  return audioMuted === true;
}
