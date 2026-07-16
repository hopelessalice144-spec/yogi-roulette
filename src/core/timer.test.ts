import { describe, expect, it } from 'vitest';
import {
  BALL_DROP_AT,
  BALL_MAGNET_AT,
  BALL_PHYSICS_AT,
  BALL_SETTLE_AT,
  CYCLE_SECONDS,
  getCycleId,
  getCycleSecond,
  getPhase,
  getSecondsRemaining,
  getSecondsToBallDrop,
  PHASES,
} from './timer.js';

function atUnixSecond(unixSec: number): number {
  return unixSec * 1000;
}

describe('timer', () => {
  it('exports 30-second cycle constants', () => {
    expect(CYCLE_SECONDS).toBe(30);
    expect(PHASES.BETTING.end).toBe(20);
    expect(PHASES.LOCKED.end).toBe(25);
    expect(BALL_DROP_AT).toBe(25);
    expect(BALL_PHYSICS_AT).toBe(26);
    expect(BALL_MAGNET_AT).toBe(28);
    expect(BALL_SETTLE_AT).toBe(29);
  });

  describe('getCycleSecond', () => {
    it('wraps unix seconds modulo 30', () => {
      expect(getCycleSecond(atUnixSecond(1_000_000))).toBe(10);
      expect(getCycleSecond(atUnixSecond(30))).toBe(0);
      expect(getCycleSecond(atUnixSecond(29))).toBe(29);
    });
  });

  describe('getSecondsRemaining', () => {
    it('counts down within cycle', () => {
      expect(getSecondsRemaining(atUnixSecond(7))).toBe(23);
    });
  });

  describe('getPhase', () => {
    it('maps betting window (0–19)', () => {
      const phase = getPhase(atUnixSecond(5));
      expect(phase.name).toBe('betting');
      expect(phase.cycleSecond).toBe(5);
    });

    it('maps locked window (20–24)', () => {
      const phase = getPhase(atUnixSecond(22));
      expect(phase.name).toBe('locked');
      expect(phase.cycleSecond).toBe(22);
    });

    it('maps spinning window (25–29)', () => {
      const phase = getPhase(atUnixSecond(27));
      expect(phase.name).toBe('spinning');
      expect(phase.cycleSecond).toBe(27);
    });
  });

  describe('getCycleId', () => {
    it('increments every 30 unix seconds', () => {
      const cid = 1_700_000_000;
      expect(getCycleId(atUnixSecond(cid * 30 + 5))).toBe(cid);
      expect(getCycleId(atUnixSecond(cid * 30 + 29))).toBe(cid);
      expect(getCycleId(atUnixSecond((cid + 1) * 30))).toBe(cid + 1);
    });
  });

  describe('getSecondsToBallDrop', () => {
    it('counts to drop before T-5', () => {
      expect(getSecondsToBallDrop(atUnixSecond(10))).toBe(BALL_DROP_AT - 10);
    });

    it('wraps to next cycle after drop', () => {
      expect(getSecondsToBallDrop(atUnixSecond(28))).toBe(
        CYCLE_SECONDS - 28 + BALL_DROP_AT
      );
    });
  });
});
