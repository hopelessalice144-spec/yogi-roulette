/**
 * Camera rig utilities — vertigo dolly, impact shake, orientation slerp, operator motion.
 */
import * as THREE from 'three';
import { ORBIT_Y, TRACK_Y } from './trajectory.js';
import { BALL_DROP_AT, BALL_PHYSICS_AT } from '@core/timer.js';
import { handheldSimplex, operatorBreathing } from './noise.js';

const _viewDir = new THREE.Vector3();
const _lookMat = new THREE.Matrix4();
const _targetQuat = new THREE.Quaternion();
const _compPos = new THREE.Vector3();
const _handheld = new THREE.Vector3();
const _breath = new THREE.Vector3();

/** Ball-speed-adaptive lag (legacy / tests). */
export function adaptiveLookLag(ballSpeed, baseLag = 0.08) {
  const t = THREE.MathUtils.clamp(ballSpeed / 3.4, 0, 1);
  return baseLag * (1 + t * 2.8);
}

export function adaptiveLookStiffness(ballSpeed) {
  const t = THREE.MathUtils.clamp(ballSpeed / 3.8, 0, 1);
  return THREE.MathUtils.lerp(14, 1.4, t);
}

/**
 * Adaptive EMA λ — high ball speed → lower λ → heavier lag → zero jitter.
 */
export function adaptiveLookEmaLambda(ballSpeed, baseLambda = 8) {
  const t = THREE.MathUtils.clamp(ballSpeed / 2.8, 0, 1);
  return THREE.MathUtils.lerp(baseLambda, 3.2, t * t);
}

export function descentProgress(ballPos, clock) {
  if (ballPos?.y != null) {
    const t = (ORBIT_Y - ballPos.y) / Math.max(0.001, ORBIT_Y - TRACK_Y);
    return THREE.MathUtils.clamp(t, 0, 1);
  }
  const { name, cycleSecond } = clock ?? {};
  if (name !== 'spinning' || cycleSecond < BALL_DROP_AT) return 0;
  if (cycleSecond >= BALL_PHYSICS_AT) return 1;
  return (cycleSecond - BALL_DROP_AT) / Math.max(0.001, BALL_PHYSICS_AT - BALL_DROP_AT);
}

/**
 * T-5 drop vertigo intensity — peaks during descent, holds through early chase.
 */
export function dropVertigoProgress(cycleSecFloat, phaseName) {
  if (phaseName !== 'spinning' || cycleSecFloat < BALL_DROP_AT) return 0;
  const descentEnd = BALL_PHYSICS_AT + 0.35;
  if (cycleSecFloat <= descentEnd) {
    const t = (cycleSecFloat - BALL_DROP_AT) / Math.max(0.001, descentEnd - BALL_DROP_AT);
    const ease = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    return THREE.MathUtils.clamp(ease, 0, 1);
  }
  const decay = (cycleSecFloat - descentEnd) / 1.8;
  return THREE.MathUtils.clamp(1 - decay, 0, 0.55);
}

/**
 * Vertigo dolly zoom — FOV compression with distance compensation (Hitchcock).
 * Keeps wheel scale stable while background compresses dramatically.
 */
export function dollyZoomVertigo(progress, baseFov = 55, endFov = 24) {
  const p = THREE.MathUtils.clamp(progress, 0, 1);
  const e = p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2;
  const fov = THREE.MathUtils.lerp(baseFov, endFov, e);
  const fovRad0 = THREE.MathUtils.degToRad(baseFov * 0.5);
  const fovRad1 = THREE.MathUtils.degToRad(fov * 0.5);
  const distanceScale = Math.tan(fovRad0) / Math.tan(fovRad1);
  const pullBack = THREE.MathUtils.lerp(0, 3.2, e * e);
  return { fov, pullBack, distanceScale, ease: e };
}

export function applyDistanceCompensation(position, lookAt, scale, out) {
  if (Math.abs(scale - 1) < 0.002) {
    out.copy(position);
    return out;
  }
  _viewDir.subVectors(position, lookAt);
  const dist = _viewDir.length();
  _viewDir.normalize();
  out.copy(lookAt).addScaledVector(_viewDir, dist * scale);
  return out;
}

/** Quaternion slerp toward look-at — delta-time independent. */
export function slerpTowardLookAt(currentQuat, position, targetLookAt, up, lambda, delta) {
  _lookMat.lookAt(position, targetLookAt, up);
  _targetQuat.setFromRotationMatrix(_lookMat);
  const t = 1 - Math.exp(-lambda * Math.max(delta, 0.0001));
  currentQuat.slerp(_targetQuat, t);
  return currentQuat;
}

/** Impact shake amplitude from collision velocity. */
export function impactShakeIntensity(collisionVelocity) {
  return Math.min(0.62, collisionVelocity * 0.16);
}

/**
 * Decaying spring-oscillation shake: Offset = A × e^(-βt) × sin(ωt)
 */
export function computeImpactShake(amplitude, shakeTime, beta = 10.5, omega = 48) {
  if (amplitude <= 0.0001 || shakeTime < 0) {
    return { x: 0, y: 0, z: 0, roll: 0, envelope: 0 };
  }
  const env = amplitude * Math.exp(-beta * shakeTime);
  return {
    x: env * Math.sin(omega * shakeTime),
    y: env * Math.sin(omega * shakeTime * 1.35) * 0.52,
    z: env * Math.cos(omega * shakeTime * 0.88),
    roll: env * Math.sin(omega * shakeTime * 1.1) * 0.22,
    envelope: env,
  };
}

/**
 * Cinematic operator motion — multi-octave simplex + breathing sine layers.
 */
export function cinematicHandheld(t, amplitude = 0.02, weights = {}) {
  const betting = weights.betting ?? 0;
  const spin = weights.spinDrop ?? 0;
  const settle = weights.settle ?? 0;
  const w = betting * 1 + spin * 0.45 + settle * 0.25;
  if (w < 0.01) return _handheld.set(0, 0, 0);

  const amp = amplitude * w;
  _handheld.copy(handheldSimplex(t, amp * 0.72));
  _breath.copy(operatorBreathing(t, amp * 0.28));
  return _handheld.add(_breath);
}

export const SHAKE_DECAY_MS = 0.32;
export const ORIENT_SLERP_LAMBDA = 11;

export { handheldSimplex as handheldNoise };
