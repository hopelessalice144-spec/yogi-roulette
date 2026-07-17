/** Trigger stake-scale cluster glow when board stakes were scaled. */
export function shouldScaleBoardPulse(scaledBets) {
  return Array.isArray(scaledBets) && scaledBets.length > 0;
}

/** Half vs double styling for the scale cluster pulse. */
export function scaleBoardPulseMode(factor) {
  if (factor === 0.5) return 'half';
  if (factor === 2) return 'double';
  return null;
}
