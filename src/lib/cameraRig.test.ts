import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { BALL_DROP_AT, BALL_PHYSICS_AT } from '@core/timer.js';
import { ORBIT_Y, TRACK_Y } from './trajectory.js';
import {
  adaptiveLookEmaLambda,
  adaptiveLookLag,
  adaptiveLookStiffness,
  applyDistanceCompensation,
  cinematicHandheld,
  computeImpactShake,
  descentProgress,
  dollyZoomVertigo,
  dropVertigoProgress,
  impactShakeIntensity,
  ORIENT_SLERP_LAMBDA,
  SHAKE_DECAY_MS,
  slerpTowardLookAt,
} from './cameraRig.js';

describe('cameraRig', () => {
  it('exports shake and orientation constants', () => {
    expect(SHAKE_DECAY_MS).toBe(0.32);
    expect(ORIENT_SLERP_LAMBDA).toBe(11);
  });

  describe('adaptive look lag helpers', () => {
    it('scales legacy lag with ball speed', () => {
      expect(adaptiveLookLag(0)).toBeCloseTo(0.08, 8);
      expect(adaptiveLookLag(3.4)).toBeCloseTo(0.304, 8);
      expect(adaptiveLookLag(10)).toBeCloseTo(0.304, 8);
    });

    it('reduces look stiffness as ball speed rises', () => {
      expect(adaptiveLookStiffness(0)).toBeCloseTo(14, 8);
      expect(adaptiveLookStiffness(3.8)).toBeCloseTo(1.4, 8);
    });

    it('lowers EMA lambda at high ball speed', () => {
      expect(adaptiveLookEmaLambda(0)).toBeCloseTo(8, 8);
      expect(adaptiveLookEmaLambda(2.8)).toBeCloseTo(3.2, 8);
    });
  });

  describe('descentProgress', () => {
    it('maps ball height from orbit to track', () => {
      expect(descentProgress({ y: ORBIT_Y }, null)).toBe(0);
      expect(descentProgress({ y: TRACK_Y }, null)).toBe(1);
      expect(descentProgress({ y: (ORBIT_Y + TRACK_Y) / 2 }, null)).toBeCloseTo(0.5, 5);
    });

    it('derives progress from spinning clock between drop and physics handoff', () => {
      expect(descentProgress(null, { name: 'spinning', cycleSecond: BALL_DROP_AT - 1 })).toBe(0);
      expect(descentProgress(null, { name: 'spinning', cycleSecond: BALL_DROP_AT })).toBe(0);
      expect(descentProgress(null, { name: 'spinning', cycleSecond: BALL_DROP_AT + 0.5 })).toBeCloseTo(
        0.5,
        5,
      );
      expect(descentProgress(null, { name: 'spinning', cycleSecond: BALL_PHYSICS_AT })).toBe(1);
    });
  });

  describe('dropVertigoProgress', () => {
    it('ramps during drop and decays through early chase', () => {
      expect(dropVertigoProgress(BALL_DROP_AT - 1, 'spinning')).toBe(0);
      expect(dropVertigoProgress(BALL_DROP_AT, 'spinning')).toBe(0);
      expect(dropVertigoProgress(BALL_DROP_AT + 0.2, 'spinning')).toBeGreaterThan(0);
      expect(dropVertigoProgress(BALL_PHYSICS_AT + 2, 'spinning')).toBeLessThan(0.55);
    });

    it('returns zero outside spinning phase', () => {
      expect(dropVertigoProgress(27, 'betting')).toBe(0);
    });
  });

  describe('dollyZoomVertigo', () => {
    it('returns neutral camera values at zero progress', () => {
      const start = dollyZoomVertigo(0);
      expect(start.fov).toBeCloseTo(55, 8);
      expect(start.pullBack).toBe(0);
      expect(start.distanceScale).toBeCloseTo(1, 8);
      expect(start.ease).toBe(0);
    });

    it('compresses FOV and pulls back at full vertigo', () => {
      const end = dollyZoomVertigo(1);
      expect(end.fov).toBeCloseTo(24, 8);
      expect(end.pullBack).toBeCloseTo(3.2, 8);
      expect(end.distanceScale).toBeGreaterThan(1);
      expect(end.ease).toBe(1);
    });
  });

  describe('applyDistanceCompensation', () => {
    it('copies position when scale is unity', () => {
      const position = new THREE.Vector3(0, 1.2, 4.5);
      const lookAt = new THREE.Vector3(0, 0, 0);
      const out = new THREE.Vector3();
      applyDistanceCompensation(position, lookAt, 1, out);
      expect(out.equals(position)).toBe(true);
    });

    it('scales camera distance from look-at target', () => {
      const position = new THREE.Vector3(0, 0, 5);
      const lookAt = new THREE.Vector3(0, 0, 0);
      const out = new THREE.Vector3();
      applyDistanceCompensation(position, lookAt, 2, out);
      expect(out.z).toBeCloseTo(10, 8);
    });
  });

  describe('slerpTowardLookAt', () => {
    it('rotates current quaternion toward the look-at target', () => {
      const current = new THREE.Quaternion(0, 0, 0, 1);
      const position = new THREE.Vector3(0, 1, 5);
      const target = new THREE.Vector3(0, 0, 0);
      const up = new THREE.Vector3(0, 1, 0);

      const result = slerpTowardLookAt(current, position, target, up, ORIENT_SLERP_LAMBDA, 0.016);

      expect(result).toBe(current);
      expect(current.w).not.toBe(1);
    });
  });

  describe('impact shake', () => {
    it('caps shake intensity from collision velocity', () => {
      expect(impactShakeIntensity(0)).toBe(0);
      expect(impactShakeIntensity(2)).toBeCloseTo(0.32, 8);
      expect(impactShakeIntensity(10)).toBe(0.62);
    });

    it('decays spring oscillation over time', () => {
      const early = computeImpactShake(0.5, 0.01);
      const late = computeImpactShake(0.5, 0.2);

      expect(early.envelope).toBeGreaterThan(late.envelope);
      expect(early.x).not.toBe(0);
      expect(computeImpactShake(0, 0.05).envelope).toBe(0);
    });
  });

  describe('cinematicHandheld', () => {
    it('returns zero offset when phase weights are negligible', () => {
      const v = cinematicHandheld(2, 0.02, {});
      expect(v.x).toBe(0);
      expect(v.y).toBe(0);
      expect(v.z).toBe(0);
    });

    it('blends simplex and breathing layers during betting', () => {
      const v = cinematicHandheld(2, 0.02, { betting: 1 }).clone();
      expect(v.length()).toBeGreaterThan(0);
      expect(v.length()).toBeLessThan(0.05);
    });

    it('attenuates motion during spin-drop relative to full betting weight', () => {
      const betting = cinematicHandheld(2, 0.02, { betting: 1 }).clone();
      const spinDrop = cinematicHandheld(2, 0.02, { spinDrop: 1 }).clone();
      expect(spinDrop.length()).toBeLessThan(betting.length());
    });
  });
});
