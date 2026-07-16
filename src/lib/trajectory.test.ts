import { describe, expect, it } from 'vitest';
import { pocketIndexToAngle, POCKET_CAPTURE, WHEEL } from './wheel.js';
import {
  BALL_RADIUS,
  DESCENT_DURATION,
  ORBIT_ANGULAR_BASE,
  ORBIT_RADIUS,
  ORBIT_Y,
  TRACK_RADIUS,
  TRACK_Y,
  descentPose,
  descentVelocity,
  easeInOutCubic,
  easeInOutCubicDerivative,
  handoffAngularVelocity,
  orbitPose,
  physicsHandoff,
  pocketSettleTarget,
  predictPocketTarget,
  synchronizeHandoffState,
} from './trajectory.js';

describe('trajectory', () => {
  it('exports kinematic constants derived from wheel geometry', () => {
    expect(BALL_RADIUS).toBe(0.04);
    expect(ORBIT_RADIUS).toBeCloseTo(WHEEL.trackRadius - 0.025, 8);
    expect(TRACK_RADIUS).toBeCloseTo(WHEEL.trackRadius - 0.1, 8);
    expect(ORBIT_Y).toBe(0.29);
    expect(TRACK_Y).toBe(0.26);
    expect(DESCENT_DURATION).toBe(0.88);
    expect(ORBIT_ANGULAR_BASE).toBe(2.8);
  });

  describe('easeInOutCubic', () => {
    it('starts at zero and ends at one', () => {
      expect(easeInOutCubic(0)).toBe(0);
      expect(easeInOutCubic(1)).toBe(1);
      expect(easeInOutCubic(0.5)).toBe(0.5);
    });

    it('is monotonic on [0, 1]', () => {
      let prev = easeInOutCubic(0);
      for (let t = 0.1; t <= 1; t += 0.1) {
        const next = easeInOutCubic(t);
        expect(next).toBeGreaterThanOrEqual(prev);
        prev = next;
      }
    });

    it('has zero derivative at endpoints', () => {
      expect(easeInOutCubicDerivative(0)).toBe(0);
      expect(easeInOutCubicDerivative(1)).toBe(0);
    });
  });

  describe('descentPose', () => {
    it('starts at orbit height and ends at track height', () => {
      expect(descentPose(0, 0, 0).y).toBe(ORBIT_Y);
      expect(descentPose(0, 0, 0).radius).toBeCloseTo(ORBIT_RADIUS, 8);
      expect(descentPose(1, 0, 0).y).toBeCloseTo(TRACK_Y, 8);
      expect(descentPose(1, 0, 0).radius).toBeCloseTo(TRACK_RADIUS, 8);
    });

    it('interpolates ease along the spline', () => {
      const mid = descentPose(0.5, 1.2, 0.5);
      expect(mid.ease).toBeCloseTo(0.5, 8);
      expect(mid.y).toBeCloseTo((ORBIT_Y + TRACK_Y) / 2, 8);
    });
  });

  describe('orbitPose', () => {
    it('places the ball on the orbital ring', () => {
      const pose = orbitPose(0.8, 0.3, 1.5);
      expect(pose.y).toBe(ORBIT_Y);
      expect(Math.hypot(pose.x, pose.z)).toBeCloseTo(ORBIT_RADIUS, 8);
      expect(pose.angular).toBeCloseTo(ORBIT_ANGULAR_BASE + 1.5 * 0.15, 8);
    });
  });

  describe('descentVelocity', () => {
    it('returns finite speed mid-descent', () => {
      const vel = descentVelocity(0.5, 1.2, 0.5, 2.8);
      expect(Number.isFinite(vel.speed)).toBe(true);
      expect(vel.speed).toBeGreaterThan(0);
      expect(vel.tangentX ** 2 + vel.tangentZ ** 2).toBeCloseTo(1, 8);
    });
  });

  describe('physicsHandoff', () => {
    it('packages pose, velocity, and angular velocity', () => {
      const handoff = physicsHandoff(1.2, 0.5, 2.8, 1);
      expect(handoff.handoffT).toBe(1);
      expect(handoff.velocity.speed).toBeGreaterThan(0);
      expect(handoff.angularVelocity).toMatchObject({
        x: expect.any(Number),
        y: expect.any(Number),
        z: expect.any(Number),
      });
    });

    it('stays continuous between t=0.999 and t=1', () => {
      const a = physicsHandoff(1.2, 0.5, 2.8, 1);
      const b = physicsHandoff(1.2, 0.5, 2.8, 0.999);
      const dp = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
      const dv = Math.hypot(
        a.velocity.x - b.velocity.x,
        a.velocity.y - b.velocity.y,
        a.velocity.z - b.velocity.z,
      );
      expect(dp).toBeLessThan(0.05);
      expect(dv).toBeLessThan(0.5);
    });
  });

  describe('pocket targets', () => {
    it('computes settle target on pocket mid-radius', () => {
      const angle = 1.1;
      const target = pocketSettleTarget(angle);
      expect(target).toEqual({
        x: Math.sin(angle) * POCKET_CAPTURE.pocketMidRadius,
        y: POCKET_CAPTURE.nestleY,
        z: Math.cos(angle) * POCKET_CAPTURE.pocketMidRadius,
      });
    });

    it('predicts pocket target with wheel rotation lookahead', () => {
      const wheelAngle = 0.4;
      const wheelSpinSpeed = 1.2;
      const lookahead = 0.4;
      const pocketIndex = 7;
      const expectedAngle =
        pocketIndexToAngle(pocketIndex) + wheelAngle + wheelSpinSpeed * lookahead;
      const predicted = predictPocketTarget(pocketIndex, wheelAngle, wheelSpinSpeed, lookahead);
      expect(predicted.x).toBeCloseTo(Math.sin(expectedAngle) * POCKET_CAPTURE.pocketMidRadius, 8);
      expect(predicted.y).toBe(POCKET_CAPTURE.nestleY);
    });
  });

  it('synchronizeHandoffState clamps descentT and delegates to physicsHandoff', () => {
    const sync = synchronizeHandoffState(1.2, 0.5, 2.8, 1.5);
    const handoff = physicsHandoff(1.2, 0.5, 2.8, 1);
    expect(sync.handoffT).toBe(1);
    expect(sync.x).toBeCloseTo(handoff.x, 8);
    expect(sync.velocity.speed).toBeCloseTo(handoff.velocity.speed, 8);
  });

  it('handoffAngularVelocity delegates to rollingAngularVelocity', () => {
    const omega = handoffAngularVelocity({ x: 1, y: 0, z: 0, speed: 1 });
    expect(omega.z).toBeLessThan(0);
  });
});
