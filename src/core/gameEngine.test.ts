import { describe, expect, it } from 'vitest';
import { BALL_DROP_AT, BALL_SETTLE_AT } from './timer.js';
import {
  bettingLockTimestampMs,
  canPlaceBet,
  createGameClock,
  PHASE,
  resolveCycleOutcome,
  resolveHudPhaseFromClock,
  secondsUntilSpin,
} from './gameEngine.js';
import { commitServerSeed, deriveWinningNumber } from './provablyFair.js';

const CYCLE_ID = 1_700_000_000;

function atCycleSecond(sec: number): number {
  return (CYCLE_ID * 30 + sec) * 1000;
}

describe('gameEngine', () => {
  describe('createGameClock', () => {
    it('reports betting phase with acceptsBets', () => {
      const clock = createGameClock(atCycleSecond(5));
      expect(clock.name).toBe(PHASE.BETTING);
      expect(clock.acceptsBets).toBe(true);
      expect(clock.betsLocked).toBe(false);
      expect(clock.cycleId).toBe(CYCLE_ID);
      expect(clock.cycleSeconds).toBe(30);
    });

    it('reports locked phase', () => {
      const clock = createGameClock(atCycleSecond(22));
      expect(clock.name).toBe(PHASE.LOCKED);
      expect(clock.acceptsBets).toBe(false);
      expect(clock.betsLocked).toBe(true);
    });

    it('reports spinning with ball drop and settle flags', () => {
      const spinning = createGameClock(atCycleSecond(BALL_DROP_AT));
      expect(spinning.name).toBe(PHASE.SPINNING);
      expect(spinning.ballDropped).toBe(true);
      expect(spinning.settling).toBe(false);

      const settling = createGameClock(atCycleSecond(BALL_SETTLE_AT));
      expect(settling.settling).toBe(true);
    });
  });

  describe('bettingLockTimestampMs', () => {
    it('locks at bettingEnd seconds into cycle', () => {
      expect(bettingLockTimestampMs(CYCLE_ID)).toBe((CYCLE_ID * 30 + 20) * 1000);
    });
  });

  describe('canPlaceBet', () => {
    it('mirrors acceptsBets on clock', () => {
      expect(canPlaceBet({ acceptsBets: true })).toBe(true);
      expect(canPlaceBet({ acceptsBets: false })).toBe(false);
      expect(canPlaceBet(null)).toBe(false);
    });
  });

  describe('resolveCycleOutcome', () => {
    const seed = 'c'.repeat(32);

    it('uses provably fair context when provided', () => {
      const expected = deriveWinningNumber(seed, 'guest', 42);
      const outcome = resolveCycleOutcome(42, { serverSeed: seed, clientSeed: 'guest' });
      expect(outcome).toBe(expected);
    });

    it('falls back to deterministic LCG without fair context', () => {
      const a = resolveCycleOutcome(7, null);
      const b = resolveCycleOutcome(7, null);
      expect(a).toBe(b);
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThan(37);
    });
  });

  describe('resolveHudPhaseFromClock', () => {
    it('maps engine phases to HUD phases', () => {
      expect(resolveHudPhaseFromClock({ name: 'betting', cycleSecond: 3 })).toBe('betting');
      expect(resolveHudPhaseFromClock({ name: 'locked', cycleSecond: 21 })).toBe('locked');
      expect(resolveHudPhaseFromClock({ name: 'spinning', cycleSecond: BALL_DROP_AT })).toBe(
        'spin-focus'
      );
      expect(resolveHudPhaseFromClock({ name: 'spinning', cycleSecond: BALL_SETTLE_AT })).toBe(
        'settle-reveal'
      );
    });
  });

  describe('secondsUntilSpin', () => {
    it('counts down to ball drop within cycle', () => {
      expect(secondsUntilSpin(atCycleSecond(10))).toBe(BALL_DROP_AT - 10);
    });
  });
});

describe('gameEngine integration', () => {
  it('commit hash verifies derived outcome', () => {
    const seed = 'd'.repeat(32);
    const hash = commitServerSeed(seed);
    const winning = resolveCycleOutcome(99, { serverSeed: seed, clientSeed: 'guest' });
    expect(deriveWinningNumber(seed, 'guest', 99)).toBe(winning);
    expect(hash).toHaveLength(64);
  });
});
