import { describe, expect, it, vi } from 'vitest';
import { ORBIT_Y, TRACK_RADIUS, TRACK_Y } from './trajectory.js';
import { WHEEL } from './wheel.js';
import {
  BALL_BOUNDS,
  createWatchdogJournal,
  isBallStuck,
  recordWatchdogEvent,
  recoverBallIfOOB,
  SETTLE_WATCHDOG_MS,
  WATCHDOG_EVENT,
  watchdogLerpAlpha,
} from './physicsWatchdog.js';

type RecoveryPose = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
};

describe('physicsWatchdog', () => {
  it('exports settle watchdog timing and event types', () => {
    expect(SETTLE_WATCHDOG_MS).toBe(4000);
    expect(WATCHDOG_EVENT).toEqual({
      OOB_RECOVERY: 'oob',
      SETTLE_FORCE: 'settle',
      STUCK_RECOVERY: 'stuck',
    });
    expect(BALL_BOUNDS.maxRadius).toBeGreaterThan(WHEEL.trackRadius);
  });

  describe('createWatchdogJournal / recordWatchdogEvent', () => {
    it('starts with zeroed counters', () => {
      expect(createWatchdogJournal()).toEqual({
        oobRecoveries: 0,
        settleForces: 0,
        stuckRecoveries: 0,
        lastEvent: null,
        lastAt: 0,
      });
    });

    it('records events and increments counters', () => {
      vi.spyOn(Date, 'now').mockReturnValue(12345);
      const journal = createWatchdogJournal();
      recordWatchdogEvent(journal, WATCHDOG_EVENT.OOB_RECOVERY);
      recordWatchdogEvent(journal, WATCHDOG_EVENT.SETTLE_FORCE);
      recordWatchdogEvent(journal, WATCHDOG_EVENT.STUCK_RECOVERY);
      expect(journal).toMatchObject({
        oobRecoveries: 1,
        settleForces: 1,
        stuckRecoveries: 1,
        lastEvent: WATCHDOG_EVENT.STUCK_RECOVERY,
        lastAt: 12345,
      });
      vi.restoreAllMocks();
    });

    it('no-ops when journal is null', () => {
      expect(() => recordWatchdogEvent(null, WATCHDOG_EVENT.OOB_RECOVERY)).not.toThrow();
    });
  });

  describe('recoverBallIfOOB', () => {
    it('returns null when ball is within bounds', () => {
      expect(recoverBallIfOOB(0.4, 0.25, 0.4)).toBeNull();
    });

    it('snaps far OOB coordinates back to track with zero velocity', () => {
      const recovered = recoverBallIfOOB(5, 5, 5, 0, null) as RecoveryPose | null;
      expect(recovered).not.toBeNull();
      expect(recovered).toMatchObject({ vx: 0, vy: 0, vz: 0 });
      expect(Math.hypot(recovered!.x, recovered!.z)).toBeLessThanOrEqual(TRACK_RADIUS + 0.001);
      expect(recovered!.y).toBeGreaterThanOrEqual(TRACK_Y);
      expect(recovered!.y).toBeLessThanOrEqual(ORBIT_Y);
    });

    it('recovers non-finite coordinates and logs to journal', () => {
      const journal = createWatchdogJournal();
      // @ts-expect-error runtime journal object wider than null default literal
      const recovered = recoverBallIfOOB(Number.NaN, 0.2, 0.2, 0.5, journal) as RecoveryPose | null;
      expect(recovered).not.toBeNull();
      expect(journal.oobRecoveries).toBe(1);
      expect(journal.lastEvent).toBe(WATCHDOG_EVENT.OOB_RECOVERY);
    });

    it('uses track height when ball falls below minimum Y', () => {
      const recovered = recoverBallIfOOB(0.2, 0.01, 0.2) as RecoveryPose | null;
      expect(recovered?.y).toBe(TRACK_Y);
    });
  });

  describe('isBallStuck', () => {
    it('ignores non-free phases', () => {
      expect(isBallStuck(0.01, 'orbit', 5000)).toBe(false);
      expect(isBallStuck(0.01, 'descent', 5000)).toBe(false);
    });

    it('detects stalled free or guided balls', () => {
      expect(isBallStuck(0.01, 'free', 3000)).toBe(true);
      expect(isBallStuck(0.01, 'guided', 3000)).toBe(true);
      expect(isBallStuck(0.2, 'free', 3000)).toBe(false);
      expect(isBallStuck(0.01, 'free', 1000)).toBe(false);
    });
  });

  describe('watchdogLerpAlpha', () => {
    it('ramps from zero toward one over duration', () => {
      expect(watchdogLerpAlpha(0)).toBe(0);
      const mid = watchdogLerpAlpha(450);
      const end = watchdogLerpAlpha(900);
      expect(mid).toBeGreaterThan(0);
      expect(mid).toBeLessThan(1);
      expect(end).toBeCloseTo(1 - Math.exp(-4.8), 8);
    });
  });
});
