/** Subtle repeat-button pulse when last round can be restored. */
export function shouldRepeatReadyGlow(canRepeat) {
  return canRepeat === true;
}
