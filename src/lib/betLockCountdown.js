import { PHASES } from '@core/timer.js';

/** Countdown state for the betting-phase lock ring around the HUD phase pill. */
export function betLockCountdown(cycleSecond, phaseName = 'betting') {
  if (phaseName !== PHASES.BETTING.name) {
    return { active: false, secondsLeft: 0, remaining: 0, urgent: false };
  }

  const sec = Math.floor(Number(cycleSecond) || 0);
  const { start, end } = PHASES.BETTING;
  if (sec < start || sec >= end) {
    return { active: false, secondsLeft: 0, remaining: 0, urgent: false };
  }

  const duration = end - start;
  const secondsLeft = end - sec;
  return {
    active: true,
    secondsLeft,
    remaining: secondsLeft / duration,
    urgent: secondsLeft <= 5,
  };
}
