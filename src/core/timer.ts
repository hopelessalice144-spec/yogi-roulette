/** Wall-clock live-sync timer (unixSeconds % 30). */

import type { PhaseName } from './types.js';

export const CYCLE_SECONDS = 30;

export interface PhaseWindow {
  readonly start: number;
  readonly end: number;
  readonly name: PhaseName;
}

export const PHASES = Object.freeze({
  BETTING: { start: 0, end: 20, name: 'betting' },
  LOCKED: { start: 20, end: 25, name: 'locked' },
  SPINNING: { start: 25, end: 30, name: 'spinning' },
} satisfies Record<'BETTING' | 'LOCKED' | 'SPINNING', PhaseWindow>);

/** T-5 — begin orbital descent into the bowl. */
export const BALL_DROP_AT = 25;
/** End of kinematic spiral; hand off to Rapier. */
export const BALL_PHYSICS_AT = 26;
/** T-1 — spring guide into winning pocket. */
export const BALL_MAGNET_AT = 28;
/** T-0 — settle / read pocket. */
export const BALL_SETTLE_AT = 29;

export interface PhaseSnapshot {
  name: PhaseName;
  cycleSecond: number;
  secondsRemaining: number;
}

export function getCycleSecond(nowMs: number = Date.now()): number {
  return Math.floor(nowMs / 1000) % CYCLE_SECONDS;
}

export function getSecondsRemaining(nowMs: number = Date.now()): number {
  return CYCLE_SECONDS - getCycleSecond(nowMs);
}

export function getPhase(nowMs: number = Date.now()): PhaseSnapshot {
  const cycleSecond = getCycleSecond(nowMs);
  let name: PhaseName = PHASES.SPINNING.name;
  if (cycleSecond >= PHASES.BETTING.start && cycleSecond < PHASES.BETTING.end) {
    name = PHASES.BETTING.name;
  } else if (cycleSecond >= PHASES.LOCKED.start && cycleSecond < PHASES.LOCKED.end) {
    name = PHASES.LOCKED.name;
  }
  return { name, cycleSecond, secondsRemaining: getSecondsRemaining(nowMs) };
}

export function getCycleId(nowMs: number = Date.now()): number {
  return Math.floor(Math.floor(nowMs / 1000) / CYCLE_SECONDS);
}

export function getSecondsToBallDrop(nowMs: number = Date.now()): number {
  const s = getCycleSecond(nowMs);
  if (s < BALL_DROP_AT) return BALL_DROP_AT - s;
  return CYCLE_SECONDS - s + BALL_DROP_AT;
}

console.assert(getCycleSecond(1_000_000 * 1000) === 10, 'cycle % 30');
