import { describe, expect, it } from 'vitest';
import { BALL_PHYSICS, POCKET_CAPTURE } from './wheel.js';
import {
  applyRollingKinetics,
  CAPTURE_STAGE,
  nestlePose,
  pocketGuideImpulse,
  resolveCaptureStage,
  rollingAngularVelocity,
} from './ballPhysics.js';

type Vec3 = { x: number; y: number; z: number };

function mockRigidBody(opts: {
  linvel?: Vec3;
  angvel?: Vec3;
  translation?: Vec3;
} = {}) {
  const impulses: Vec3[] = [];
  const angvelSets: Vec3[] = [];
  return {
    linvel: () => opts.linvel ?? { x: 0, y: 0, z: 0 },
    angvel: () => opts.angvel ?? { x: 0, y: 0, z: 0 },
    translation: () => opts.translation ?? { x: 0, y: 0.2, z: 0 },
    applyImpulse: (imp: Vec3) => impulses.push(imp),
    setAngvel: (av: Vec3) => angvelSets.push(av),
    impulses,
    angvelSets,
  };
}

describe('ballPhysics', () => {
  it('exports capture stage progression', () => {
    expect(CAPTURE_STAGE).toEqual({
      GUIDE: 0,
      CAPTURE: 1,
      NESTLE: 2,
      LOCKED: 3,
    });
  });

  describe('rollingAngularVelocity', () => {
    it('maps linear velocity to rolling spin perpendicular to motion', () => {
      const omega = rollingAngularVelocity({ x: 1, y: 0, z: 0 });
      expect(omega.x).toBeCloseTo(0, 8);
      expect(omega.z).toBeLessThan(0);
      expect(omega.y).toBeGreaterThan(0);
    });

    it('uses ball radius from wheel physics preset by default', () => {
      const omega = rollingAngularVelocity({ x: 0, y: 0, z: 2 });
      expect(omega.x).toBeCloseTo(2 / BALL_PHYSICS.radius, 8);
      expect(omega.z).toBeCloseTo(0, 8);
    });

    it('guards against tiny-radius division', () => {
      // @ts-expect-error exercise sub-default radius clamp in rollingAngularVelocity
      const omega = rollingAngularVelocity({ x: 1, y: 0, z: 0 }, 0.001);
      expect(Number.isFinite(omega.x)).toBe(true);
      expect(Number.isFinite(omega.z)).toBe(true);
    });
  });

  describe('resolveCaptureStage', () => {
    it('starts in guide stage when far from pocket', () => {
      expect(resolveCaptureStage(0.2, 1.5, CAPTURE_STAGE.GUIDE)).toBe(CAPTURE_STAGE.GUIDE);
    });

    it('promotes to capture inside capture radius', () => {
      expect(resolveCaptureStage(POCKET_CAPTURE.captureRadius - 0.01, 0.8, CAPTURE_STAGE.GUIDE)).toBe(
        CAPTURE_STAGE.CAPTURE,
      );
    });

    it('promotes to nestle when slow and inside lock radius', () => {
      expect(resolveCaptureStage(POCKET_CAPTURE.lockRadius - 0.005, 0.1, CAPTURE_STAGE.CAPTURE)).toBe(
        CAPTURE_STAGE.NESTLE,
      );
    });

    it('holds nestle stage once reached', () => {
      expect(resolveCaptureStage(0.2, 2, CAPTURE_STAGE.NESTLE)).toBe(CAPTURE_STAGE.NESTLE);
    });
  });

  describe('nestlePose', () => {
    it('eases toward target with bounce envelope', () => {
      const current = { x: 0.1, y: 0.2, z: 0.1 };
      const target = { x: 0.2, y: 0.12, z: 0.15, angle: 0.5 };
      const mid = nestlePose(current, target, 0.5, 1 / 60);
      expect(mid.done).toBe(false);
      expect(mid.x).toBeGreaterThan(current.x);
      expect(mid.x).toBeLessThan(target.x);
    });

    it('marks done at alpha >= 1 and settles near target', () => {
      const current = { x: 0, y: 0.2, z: 0 };
      const target = { x: 0.05, y: 0.1, z: 0.04, angle: 1.2 };
      const done = nestlePose(current, target, 1, 1 / 60);
      expect(done.done).toBe(true);
      expect(done.x).toBeCloseTo(target.x, 2);
      expect(done.y).toBeCloseTo(target.y, 2);
      expect(done.z).toBeCloseTo(target.z, 2);
    });
  });

  describe('applyRollingKinetics', () => {
    it('skips impulses when tangential speed is negligible', () => {
      const rb = mockRigidBody({ linvel: { x: 0.001, y: 0, z: 0 } });
      applyRollingKinetics(rb, 1 / 60);
      expect(rb.impulses).toHaveLength(0);
      expect(rb.angvelSets).toHaveLength(0);
    });

    it('applies friction impulse and blends angular velocity when moving', () => {
      const rb = mockRigidBody({
        linvel: { x: 1.2, y: 0, z: 0.4 },
        angvel: { x: 0, y: 0.5, z: 0 },
        translation: { x: 0.3, y: 0.2, z: 0.1 },
      });
      applyRollingKinetics(rb, 1 / 60);
      expect(rb.impulses.length).toBeGreaterThan(0);
      expect(rb.angvelSets.length).toBe(1);
      const impulse = rb.impulses[0]!;
      expect(Math.hypot(impulse.x, impulse.z)).toBeGreaterThan(0);
    });
  });

  describe('pocketGuideImpulse', () => {
    it('applies stronger correction during capture stage', () => {
      const guideRb = mockRigidBody({
        linvel: { x: 0.2, y: 0, z: 0.1 },
        translation: { x: 0.1, y: 0.2, z: 0.1 },
      });
      const captureRb = mockRigidBody({
        linvel: { x: 0.2, y: 0, z: 0.1 },
        translation: { x: 0.1, y: 0.2, z: 0.1 },
      });
      const target = { x: 0.2, y: 0.12, z: 0.18 };
      pocketGuideImpulse(guideRb, target, 0.8, 1 / 60, CAPTURE_STAGE.GUIDE);
      // @ts-expect-error capture stage is wider than GUIDE default literal
      pocketGuideImpulse(captureRb, target, 0.8, 1 / 60, CAPTURE_STAGE.CAPTURE);
      const guideMag = Math.hypot(guideRb.impulses[0]!.x, guideRb.impulses[0]!.z);
      const captureMag = Math.hypot(captureRb.impulses[0]!.x, captureRb.impulses[0]!.z);
      expect(captureMag).toBeGreaterThan(guideMag);
    });
  });
});
