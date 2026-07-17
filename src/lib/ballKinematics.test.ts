import { describe, expect, it } from 'vitest';
import { BALL_DROP_AT, BALL_PHYSICS_AT } from '@core/timer.js';
import {
  cycleTimeSec,
  descentProgressAtClock,
  orbitAngleAtCycleTime,
  orbitAngularSpeed,
  resolveKinematicBallState,
} from './ballKinematics.js';
import { orbitPose } from './trajectory.js';

describe('ballKinematics', () => {
  it('uses consistent orbit angular speed with trajectory', () => {
    const spin = 2.8;
    const t = 12.5;
    const angle = orbitAngleAtCycleTime(t, spin);
    const pose = orbitPose(angle, 0, spin);
    expect(pose.angular).toBe(orbitAngularSpeed(spin));
  });

  it('matches orbit pose at betting second 10', () => {
    const clock = { name: 'betting' as const, cycleSecond: 10 };
    const kin = resolveKinematicBallState(clock, 0, 0.42);
    const expected = orbitPose(orbitAngleAtCycleTime(10, 0.42), 0, 0.42);
    expect(kin.phase).toBe('orbit');
    expect(kin.position).toEqual({ x: expected.x, y: expected.y, z: expected.z });
  });

  it('advances descent with sub-second clock', () => {
    const span = BALL_PHYSICS_AT - BALL_DROP_AT;
    const midMs = BALL_DROP_AT * 1000 + (span * 1000) / 2;
    const clock = {
      name: 'spinning' as const,
      cycleSecond: BALL_DROP_AT,
      nowMs: midMs,
    };
    expect(descentProgressAtClock(clock)).toBeCloseTo(0.5, 2);
    expect(cycleTimeSec(clock)).toBeCloseTo(BALL_DROP_AT + span / 2, 2);
  });
});
