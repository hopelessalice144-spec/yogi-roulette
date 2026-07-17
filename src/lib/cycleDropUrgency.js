import { BALL_DROP_AT } from '@core/timer.js';

export const CYCLE_DROP_URGENCY_SECONDS = 5;

/** Whole seconds until the ball drops on the current cycle. */
export function cycleDropSecondsLeft(cycleSecond) {
  const sec = Math.floor(Number(cycleSecond) || 0);
  if (sec >= BALL_DROP_AT) return 0;
  return BALL_DROP_AT - sec;
}

/** Warm cycle-track pulse in the final seconds before ball drop. */
export function shouldCycleDropUrgency(cycleSecond, phaseName) {
  if (phaseName !== 'betting' && phaseName !== 'locked') return false;
  const left = cycleDropSecondsLeft(cycleSecond);
  return left > 0 && left <= CYCLE_DROP_URGENCY_SECONDS;
}
