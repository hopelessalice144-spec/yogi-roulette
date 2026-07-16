import { describe, expect, it } from 'vitest';
import {
  BALL_DROP_AT,
  BALL_PHYSICS_AT,
  BALL_SETTLE_AT,
  CYCLE_SECONDS,
} from '@core/timer.js';
import {
  computeBallKinematicSync,
  computeWheelAngleSync,
  missedSettleCycle,
  wallClockSnapshot,
} from './cycleResync.js';
import { ORBIT_ANGULAR_BASE, ORBIT_RADIUS, ORBIT_Y, orbitPose } from './trajectory.js';

const SNAPSHOT_MS = 1_000_000_000;

describe('cycleResync', () => {
  describe('wallClockSnapshot', () => {
    it('merges phase snapshot with cycle id and timestamp', () => {
      const snap = wallClockSnapshot(SNAPSHOT_MS);
      expect(snap.nowMs).toBe(SNAPSHOT_MS);
      expect(snap.cycleSecond).toBe(10);
      expect(snap.name).toBe('betting');
      expect(snap.secondsRemaining).toBe(CYCLE_SECONDS - 10);
      expect(snap.cycleId).toBe(Math.floor(SNAPSHOT_MS / 1000 / CYCLE_SECONDS));
    });
  });

  describe('computeBallKinematicSync', () => {
    it('returns orbital pose during betting', () => {
      const clock = { name: 'betting' as const, cycleSecond: 10 };
      const orbitAngle = (10 * ORBIT_ANGULAR_BASE * 1.1) % (Math.PI * 2);
      const pose = orbitPose(orbitAngle, 0, 0.42);
      expect(computeBallKinematicSync(clock)).toEqual({
        phase: 'orbit',
        orbitAngle,
        descentT: 0,
        position: { x: pose.x, y: pose.y, z: pose.z },
        forceGuidedLock: false,
      });
    });

    it('returns descent pose at ball drop', () => {
      const clock = { name: 'spinning' as const, cycleSecond: BALL_DROP_AT };
      const sync = computeBallKinematicSync(clock);
      expect(sync.phase).toBe('descent');
      expect(sync.descentT).toBe(0);
      expect(sync.forceGuidedLock).toBe(false);
      expect(sync.position).toMatchObject({ x: expect.any(Number), y: expect.any(Number), z: expect.any(Number) });
    });

    it('returns free-phase position with completed descent', () => {
      const clock = { name: 'spinning' as const, cycleSecond: BALL_PHYSICS_AT };
      const sync = computeBallKinematicSync(clock);
      const orbitAngle = (BALL_DROP_AT * ORBIT_ANGULAR_BASE) % (Math.PI * 2);
      const angle = orbitAngle;
      expect(sync).toEqual({
        phase: 'free',
        orbitAngle,
        descentT: 1,
        position: {
          x: Math.sin(angle) * (ORBIT_RADIUS - 0.05),
          y: ORBIT_Y - 0.04,
          z: Math.cos(angle) * (ORBIT_RADIUS - 0.05),
        },
        forceGuidedLock: false,
      });
    });

    it('forces guided lock near settle', () => {
      const clock = { name: 'spinning' as const, cycleSecond: BALL_SETTLE_AT - 1 };
      const sync = computeBallKinematicSync(clock);
      expect(sync.phase).toBe('guided');
      expect(sync.position).toBeNull();
      expect(sync.forceGuidedLock).toBe(true);
      expect(sync.descentT).toBe(1);
    });
  });

  describe('missedSettleCycle', () => {
    it('returns null without active bets', () => {
      expect(missedSettleCycle({ cycleId: 5, cycleSecond: 5 }, null, false)).toBeNull();
    });

    it('returns null when current cycle already settled', () => {
      expect(missedSettleCycle({ cycleId: 5, cycleSecond: 5 }, 5, true)).toBeNull();
    });

    it('returns prior cycle id when bets missed pre-drop window', () => {
      expect(missedSettleCycle({ cycleId: 12, cycleSecond: 10 }, 12, true)).toBeNull();
      expect(missedSettleCycle({ cycleId: 12, cycleSecond: 10 }, null, true)).toBe(11);
      expect(missedSettleCycle({ cycleId: 12, cycleSecond: 10 }, 10, true)).toBe(11);
      expect(missedSettleCycle({ cycleId: 12, cycleSecond: 10 }, 11, true)).toBe(11);
    });

    it('returns null after ball drop in current cycle', () => {
      expect(missedSettleCycle({ cycleId: 12, cycleSecond: BALL_DROP_AT }, 11, true)).toBeNull();
    });
  });

  describe('computeWheelAngleSync', () => {
    it('is deterministic for fixed clock input', () => {
      const clock = { name: 'betting' as const, cycleSecond: 10, nowMs: SNAPSHOT_MS };
      const a = computeWheelAngleSync(clock, 0.42);
      const b = computeWheelAngleSync(clock, 0.42);
      expect(a).toBe(b);
      expect(Number.isFinite(a)).toBe(true);
    });
  });
});
