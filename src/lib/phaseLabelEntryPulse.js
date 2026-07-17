/** Brief phase-label flash when the ball physics phase changes. */
export function shouldPhaseLabelEntryPulse(prevLabel, nextLabel) {
  return Boolean(prevLabel) && Boolean(nextLabel) && prevLabel !== nextLabel;
}
