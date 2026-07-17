/**
 * Product-facing round phases — maps wall-clock engine state to a single FSM vocabulary.
 */
import { BALL_SETTLE_AT } from './timer.js';
import { PHASE } from './gameEngine.js';
import type { GameClock } from './types.js';

export const RoundPhase = Object.freeze({
  PLACING_BETS: 'PLACING_BETS',
  BETS_CLOSED: 'BETS_CLOSED',
  SPINNING: 'SPINNING',
  SETTLING: 'SETTLING',
} as const);

export type RoundPhaseName = (typeof RoundPhase)[keyof typeof RoundPhase];

export function resolveRoundPhase(
  clock: Pick<GameClock, 'name' | 'cycleSecond'>
): RoundPhaseName {
  if (clock.name === PHASE.BETTING) return RoundPhase.PLACING_BETS;
  if (clock.name === PHASE.LOCKED) return RoundPhase.BETS_CLOSED;
  if (clock.cycleSecond >= BALL_SETTLE_AT) return RoundPhase.SETTLING;
  return RoundPhase.SPINNING;
}

console.assert(resolveRoundPhase({ name: 'betting', cycleSecond: 5 }) === RoundPhase.PLACING_BETS);
