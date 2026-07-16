import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { BALL_DROP_AT, BALL_SETTLE_AT } from '@core/timer.js';
import {
  CAMERA_MODES,
  CAMERA_STATE,
  computeCameraTargets,
  computeStateWeights,
  emaVec3,
  getCycleTimeFloat,
  LOOK_EMA_LAMBDA,
  LOOK_SHADOW_LAMBDA,
  resolveCameraState,
  springVec3,
} from './cameraDirector.js';

describe('cameraDirector', () => {
  it('exports EMA lambdas and frozen camera presets', () => {
    expect(LOOK_EMA_LAMBDA).toBe(8);
    expect(LOOK_SHADOW_LAMBDA).toBe(4.5);
    expect(CAMERA_STATE).toEqual({
      BETTING: 'betting',
      SPIN_DROP: 'spin_drop',
      SETTLE: 'settle',
    });
    expect(CAMERA_MODES.lounge.fov).toBe(55);
    expect(CAMERA_MODES.macro.fov).toBe(22);
  });

  describe('getCycleTimeFloat', () => {
    it('wraps wall-clock milliseconds into a 30-second cycle', () => {
      expect(getCycleTimeFloat(0)).toBe(0);
      expect(getCycleTimeFloat(15_000)).toBe(15);
      expect(getCycleTimeFloat(30_000)).toBe(0);
      expect(getCycleTimeFloat(45_000)).toBe(15);
    });
  });

  describe('resolveCameraState', () => {
    it('returns betting outside the spin window', () => {
      expect(resolveCameraState(10, 'betting')).toBe(CAMERA_STATE.BETTING);
      expect(resolveCameraState(24, 'spinning')).toBe(CAMERA_STATE.BETTING);
    });

    it('enters spin_drop at ball drop and settle at T-0', () => {
      expect(resolveCameraState(BALL_DROP_AT, 'spinning')).toBe(CAMERA_STATE.SPIN_DROP);
      expect(resolveCameraState(BALL_SETTLE_AT, 'spinning')).toBe(CAMERA_STATE.SETTLE);
    });
  });

  describe('computeStateWeights', () => {
    it('weights betting during non-spin phases', () => {
      expect(computeStateWeights(12, 'betting')).toEqual({
        betting: 1,
        spinDrop: 0,
        settle: 0,
      });
    });

    it('eases off betting during the locked phase', () => {
      const locked = computeStateWeights(25, 'locked');
      expect(locked.betting).toBeCloseTo(0.88, 5);
      expect(locked.spinDrop).toBe(0);
    });

    it('ramps spin_drop after ball drop and settle after magnet', () => {
      const drop = computeStateWeights(BALL_DROP_AT + 0.6, 'spinning');
      expect(drop.spinDrop).toBeGreaterThan(0.5);
      expect(drop.betting).toBeLessThan(0.5);

      const settle = computeStateWeights(BALL_SETTLE_AT + 0.5, 'spinning');
      expect(settle.settle).toBeGreaterThan(0);
      expect(settle.spinDrop).toBeGreaterThan(0);
      expect(settle.settle + settle.spinDrop).toBeCloseTo(1, 5);
    });
  });

  describe('emaVec3', () => {
    it('moves current toward target with delta-time independent alpha', () => {
      const current = new THREE.Vector3(0, 0, 0);
      const target = new THREE.Vector3(10, 0, 0);
      emaVec3(current, target, 8, 0.016);
      expect(current.x).toBeGreaterThan(0);
      expect(current.x).toBeLessThan(10);
      emaVec3(current, target, 8, 0.016);
      expect(current.x).toBeGreaterThan(0.5);
    });
  });

  describe('springVec3', () => {
    it('drives position toward the target via damped velocity', () => {
      const current = new THREE.Vector3(0, 0, 0);
      const target = new THREE.Vector3(2, 0, 0);
      const velocity = new THREE.Vector3(0, 0, 0);

      for (let i = 0; i < 60; i++) {
        springVec3(current, target, velocity, 12, 8, 0.016);
      }

      expect(current.x).toBeGreaterThan(0.9);
      expect(current.x).toBeLessThan(2.1);
    });
  });

  describe('computeCameraTargets', () => {
    it('returns lounge-weighted targets during betting', () => {
      const targets = computeCameraTargets({
        mode: undefined,
        clock: { name: 'betting', cycleSecond: 8 },
        ballPos: { x: 0, y: 0.2, z: 0 },
        ballVel: { x: 0, y: 0, z: 0 },
        wheelAngle: 0,
        targetNumber: undefined,
        elapsedTime: 4,
        cycleTimeFloat: 8,
      });

      expect(targets.stateWeights.betting).toBe(1);
      expect(targets.position.length()).toBeGreaterThan(4);
      expect(targets.lookAt.y).toBeCloseTo(0.35, 5);
      expect(targets.fov).toBeCloseTo(CAMERA_MODES.lounge.fov, 5);
    });

    it('blends chase targets during spin_drop with ball kinematics', () => {
      const targets = computeCameraTargets({
        mode: 'chase',
        clock: { name: 'spinning', cycleSecond: 27 },
        ballPos: { x: 0.8, y: 0.2, z: 0.6 },
        ballVel: { x: -0.4, y: 0, z: 0.5 },
        wheelAngle: 0.2,
        targetNumber: undefined,
        elapsedTime: 10,
        cycleTimeFloat: 27,
      });

      expect(targets.stateWeights.spinDrop).toBeGreaterThan(0.9);
      expect(targets.position.y).toBeGreaterThan(0.5);
      expect(targets.fov).toBeLessThan(CAMERA_MODES.lounge.fov);
      expect(targets.vertigoProgress).toBeGreaterThan(0);
      expect(targets.stiffness).toBeGreaterThan(CAMERA_MODES.lounge.stiffness);
    });

    it('focuses macro settle framing on the winning pocket', () => {
      const targets = computeCameraTargets({
        mode: undefined,
        clock: { name: 'spinning', cycleSecond: 29.5 },
        ballPos: { x: 0.4, y: 0.15, z: 0.3 },
        ballVel: { x: 0, y: 0, z: 0 },
        wheelAngle: 0.5,
        targetNumber: 7,
        elapsedTime: 12,
        cycleTimeFloat: 29.5,
      });

      expect(targets.stateWeights.settle).toBeGreaterThan(0);
      expect(targets.fov).toBeLessThan(40);
      expect(targets.position.distanceTo(targets.lookAt)).toBeGreaterThan(0.2);
    });
  });
});
