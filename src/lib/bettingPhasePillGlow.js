import { PHASES } from '@core/timer.js';

/** Subtle phase-pill idle pulse while the betting window is open. */
export function shouldBettingPhasePillGlow(phaseName) {
  return phaseName === PHASES.BETTING.name;
}
