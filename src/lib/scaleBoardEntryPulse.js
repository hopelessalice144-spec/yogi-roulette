/** Brief stake-scale cluster flash when board stakes are scaled. */

export function shouldScaleBoardEntryPulse(pulseKey) {

  return Math.floor(Number(pulseKey) || 0) > 0;

}

/** Half vs double styling for the scale cluster entry pulse. */

export function scaleBoardEntryPulseMode(factor) {

  if (factor === 0.5) return 'half';

  if (factor === 2) return 'double';

  return null;

}

