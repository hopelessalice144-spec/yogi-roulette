/**
 * Pure game engine — phase machine, bet acceptance, cycle boundaries.
 */

import {
  CYCLE_SECONDS,
  PHASES,
  BALL_DROP_AT,
  BALL_SETTLE_AT,
  getPhase,
  getCycleId,
  getCycleSecond,
} from './timer.js';
import { APP_CONFIG } from './config.js';
import { deriveWinningNumber } from './provablyFair.js';
import type { FairContext, GameClock, HudPhase } from './types.js';

export const PHASE = Object.freeze({
  BETTING: PHASES.BETTING.name,
  LOCKED: PHASES.LOCKED.name,
  SPINNING: PHASES.SPINNING.name,
});

export function createGameClock(nowMs: number = Date.now()): Readonly<GameClock> {
  const { name, cycleSecond, secondsRemaining } = getPhase(nowMs);
  const cycleId = getCycleId(nowMs);
  return Object.freeze({
    nowMs,
    name: name as GameClock['name'],
    cycleSecond,
    cycleId,
    secondsRemaining,
    cycleSeconds: CYCLE_SECONDS,
    acceptsBets: name === PHASE.BETTING,
    betsLocked: name !== PHASE.BETTING,
    isSpinning: name === PHASE.SPINNING,
    ballDropped: name === PHASE.SPINNING && cycleSecond >= BALL_DROP_AT,
    settling: name === PHASE.SPINNING && cycleSecond >= BALL_SETTLE_AT,
  });
}

export function bettingLockTimestampMs(cycleId: number, nowMs: number = Date.now()): number {
  const cycleStartSec = cycleId * CYCLE_SECONDS;
  const lockSec = cycleStartSec + APP_CONFIG.cycle.bettingEnd;
  return lockSec * 1000;
}

export function canPlaceBet(clock: Pick<GameClock, 'acceptsBets'> | null | undefined): boolean {
  return clock?.acceptsBets === true;
}

export function resolveCycleOutcome(
  cycleId: number,
  fairContext: FairContext | null = null
): number {
  if (fairContext?.serverSeed && fairContext?.clientSeed != null) {
    return deriveWinningNumber(fairContext.serverSeed, fairContext.clientSeed, cycleId);
  }
  const seed = (cycleId * 1664525 + 1013904223) >>> 0;
  return seed % APP_CONFIG.pockets;
}

export function resolveHudPhaseFromClock(
  clock: Pick<GameClock, 'name' | 'cycleSecond'>
): HudPhase {
  if (clock.name === PHASE.SPINNING) {
    if (clock.cycleSecond >= BALL_SETTLE_AT) return 'settle-reveal';
    if (clock.cycleSecond >= BALL_DROP_AT) return 'spin-focus';
  }
  if (clock.name === PHASE.LOCKED) return 'locked';
  return 'betting';
}

export function secondsUntilSpin(nowMs: number = Date.now()): number {
  const s = getCycleSecond(nowMs);
  if (s < BALL_DROP_AT) return BALL_DROP_AT - s;
  return CYCLE_SECONDS - s + BALL_DROP_AT;
}

console.assert(createGameClock().cycleSeconds === 30, 'engine cycle length');
console.assert(typeof createGameClock().acceptsBets === 'boolean', 'engine acceptsBets');
