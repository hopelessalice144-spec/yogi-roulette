import { PHASES } from '@core/timer.js';

/** Subtle phase-pill pulse during the live wheel spin. */
export function shouldSpinPhasePillGlow(phaseName) {
  return phaseName === PHASES.SPINNING.name;
}
