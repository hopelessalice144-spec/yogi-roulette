/** Brief repeat-button flash when last-round restore becomes available. */
export function shouldRepeatRoundReadyEntryPulse(prevCanRepeat, nextCanRepeat) {
  return prevCanRepeat !== true && nextCanRepeat === true;
}
