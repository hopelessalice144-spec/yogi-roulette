/** Brief repeat-button flash when last-round restore becomes available. */
export function shouldRepeatRoundReadyPulse(prevCanRepeat, nextCanRepeat) {
  return prevCanRepeat !== true && nextCanRepeat === true;
}
