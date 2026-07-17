import { PHASES } from '@core/timer.js';

/** Warm phase-pill pulse during the no-more-bets lock window. */
export function shouldLockPhasePillUrgency(phaseName) {
  return phaseName === PHASES.LOCKED.name;
}
