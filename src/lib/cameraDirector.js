/**
 * Hollywood Camera Director — 3-state spring physics, EMA look-at, vertigo FOV.
 */
import * as THREE from 'three';
import {
  numberToPocketIndex,
  pocketIndexToAngle,
  positionOnRing,
  WHEEL,
} from './wheel.js';
import { BALL_DROP_AT, BALL_SETTLE_AT } from '@core/timer.js';

/** EMA λ for damped look-at shadow target (eliminates ball jitter). */
export const LOOK_EMA_LAMBDA = 8.0;
/** Second-pass shadow EMA — ultra-heavy lag during chase. */
export const LOOK_SHADOW_LAMBDA = 4.5;

export const CAMERA_STATE = Object.freeze({
  BETTING: 'betting',
  SPIN_DROP: 'spin_drop',
  SETTLE: 'settle',
});

/** Legacy mode presets — used by gamePhase hints & tests. */
export const CAMERA_MODES = Object.freeze({
  lounge: { fov: 55, stiffness: 2.4, dist: 5.85, height: 3.7, lift: 0, roll: 0 },
  tension: { fov: 50, stiffness: 3.2, dist: 5.4, height: 3.45, lift: 0, roll: 0 },
  rim: { fov: 38, stiffness: 7.5, dist: 1.05, height: 0.85, lift: 0.04, roll: 0.012 },
  drop: { fov: 35, stiffness: 8.5, dist: 0.92, height: 0.72, lift: 0.03, roll: 0.01 },
  chase: { fov: 35, stiffness: 9, dist: 0.88, height: 0.65, lift: 0.02, roll: 0.008 },
  slowmo: { fov: 30, stiffness: 6, dist: 0.55, height: 0.38, lift: 0, roll: 0 },
  macro: { fov: 22, stiffness: 5, dist: 0.32, height: 0.34, lift: 0, roll: 0 },
});

const _betPos = new THREE.Vector3();
const _betLook = new THREE.Vector3();
const _spinPos = new THREE.Vector3();
const _spinLook = new THREE.Vector3();
const _settlePos = new THREE.Vector3();
const _settleLook = new THREE.Vector3();
const _outPos = new THREE.Vector3();
const _outLook = new THREE.Vector3();
const _tangent = new THREE.Vector3();
const _normal = new THREE.Vector3();
const _ballPos = new THREE.Vector3();
const _ballVel = new THREE.Vector3();

/** Fractional position within the 30s cycle (sub-second precision). */
export function getCycleTimeFloat(nowMs = Date.now()) {
  return (nowMs / 1000) % 30;
}

/** Resolve dominant cinematic state from wall-clock. */
export function resolveCameraState(cycleSecFloat, phaseName) {
  if (phaseName === 'spinning') {
    if (cycleSecFloat >= BALL_SETTLE_AT) return CAMERA_STATE.SETTLE;
    if (cycleSecFloat >= BALL_DROP_AT) return CAMERA_STATE.SPIN_DROP;
  }
  return CAMERA_STATE.BETTING;
}

/**
 * Smooth blend weights across the 3 cinematic states.
 * Returns { betting, spinDrop, settle } summing to ~1.
 */
export function computeStateWeights(cycleSecFloat, phaseName) {
  const w = { betting: 0, spinDrop: 0, settle: 0 };

  if (phaseName !== 'spinning') {
    w.betting = 1;
    if (phaseName === 'locked') {
      const lockT = THREE.MathUtils.clamp((cycleSecFloat - 20) / 5, 0, 1);
      w.betting = 1 - lockT * 0.12;
    }
    return w;
  }

  if (cycleSecFloat >= BALL_SETTLE_AT) {
    const t = THREE.MathUtils.clamp(cycleSecFloat - BALL_SETTLE_AT, 0, 1);
    const ease = 1 - (1 - t) ** 3;
    w.settle = ease;
    w.spinDrop = 1 - ease;
    return w;
  }

  if (cycleSecFloat >= BALL_DROP_AT) {
    const t = THREE.MathUtils.clamp(cycleSecFloat - BALL_DROP_AT, 0, 1.2);
    const ease = t < 0.6 ? (t / 0.6) ** 2 * 0.85 : 0.85 + (t - 0.6) * 0.125;
    w.spinDrop = THREE.MathUtils.clamp(ease, 0, 1);
    w.betting = 1 - w.spinDrop;
    return w;
  }

  w.betting = 1;
  return w;
}

/** Exponential moving average — delta-time independent. */
export function emaVec3(current, target, lambda, dt) {
  const alpha = 1 - Math.exp(-lambda * Math.max(dt, 0.0001));
  current.x += (target.x - current.x) * alpha;
  current.y += (target.y - current.y) * alpha;
  current.z += (target.z - current.z) * alpha;
  return current;
}

/** Critically damped spring for Vector3 — frame-rate independent. */
export function springVec3(current, target, velocity, stiffness, damping, dt) {
  const ax = (target.x - current.x) * stiffness - velocity.x * damping;
  const ay = (target.y - current.y) * stiffness - velocity.y * damping;
  const az = (target.z - current.z) * stiffness - velocity.z * damping;
  velocity.x += ax * dt;
  velocity.y += ay * dt;
  velocity.z += az * dt;
  current.x += velocity.x * dt;
  current.y += velocity.y * dt;
  current.z += velocity.z * dt;
}

/** State 1 — majestic orbital dolly with crane breathing. */
function bettingTargets(elapsedTime, out) {
  const R = CAMERA_MODES.lounge.dist;
  const ang = elapsedTime * 0.05;
  const y = CAMERA_MODES.lounge.height + Math.sin(elapsedTime * 0.38) * 0.2;
  out.position.set(Math.cos(ang) * R, y, Math.sin(ang) * R);
  out.lookAt.set(0, 0.35, 0);
  out.fov = CAMERA_MODES.lounge.fov;
  out.roll = 0;
  out.stiffness = CAMERA_MODES.lounge.stiffness;
}

/**
 * State 2 — F1 orbital chase: camera sweeps alongside ball, NO velocity lead on look-at.
 */
function spinDropTargets(ballPos, ballVel, dropProgress, out) {
  _ballPos.set(ballPos.x || 0, Math.max(ballPos.y ?? 0.12, 0.1), ballPos.z || 0);
  _ballVel.set(ballVel?.x ?? 0, ballVel?.y ?? 0, ballVel?.z ?? 0);

  const rx = _ballPos.x;
  const rz = _ballPos.z;
  const r = Math.hypot(rx, rz) || 1;

  _tangent.set(-rz / r, 0, rx / r);
  const cross = rx * _ballVel.z - rz * _ballVel.x;
  const side = cross >= 0 ? 1 : -1;

  const p = THREE.MathUtils.clamp(dropProgress, 0, 1);
  const chaseDist = THREE.MathUtils.lerp(1.2, 0.85, p);
  const chaseHeight = THREE.MathUtils.lerp(2.35, 0.68, p);

  out.position.set(
    _ballPos.x + _tangent.x * side * chaseDist,
    _ballPos.y + chaseHeight,
    _ballPos.z + _tangent.z * side * chaseDist
  );

  // Wheel-hub biased look — never raw physics; EMA chain damps divider impacts
  out.lookAt.set(_ballPos.x * 0.88, _ballPos.y * 0.92 + 0.04, _ballPos.z * 0.88);

  out.fov = THREE.MathUtils.lerp(55, 35, p);
  const angularVel = cross / (r * r);
  out.roll = THREE.MathUtils.clamp(angularVel * 0.006, -0.025, 0.025);
  out.stiffness = THREE.MathUtils.lerp(6, 9.5, p);
}

/** State 3 — macro pocket focus for settle & payout. */
function settleTargets(targetNumber, wheelAngle, out) {
  if (targetNumber == null) {
    out.position.set(0.3, 0.34, 0.32);
    out.lookAt.set(0, 0.1, 0);
    out.fov = CAMERA_MODES.macro.fov;
    out.roll = 0;
    out.stiffness = CAMERA_MODES.macro.stiffness;
    return;
  }

  const idx = numberToPocketIndex(targetNumber);
  const pocketAngle = pocketIndexToAngle(idx) + wheelAngle;
  const [px, , pz] = positionOnRing(WHEEL.trackRadius - 0.1, pocketAngle, 0.105);
  _normal.set(Math.sin(pocketAngle), 0, Math.cos(pocketAngle));
  const d = CAMERA_MODES.macro.dist;

  out.position.set(px + _normal.x * d, 0.34, pz + _normal.z * d);
  out.lookAt.set(px, 0.09, pz);
  out.fov = CAMERA_MODES.macro.fov;
  out.roll = 0;
  out.stiffness = CAMERA_MODES.macro.stiffness;
}

/**
 * Compute blended camera targets for the current game moment.
 * Outputs raw lookAt — apply emaVec3 in the render loop to eliminate jitter.
 */
export function computeCameraTargets({
  mode,
  clock,
  ballPos,
  ballVel,
  wheelAngle,
  targetNumber,
  elapsedTime,
  cycleTimeFloat,
}) {
  const phaseName = clock?.name ?? 'betting';
  const cycleSec = cycleTimeFloat ?? clock?.cycleSecond ?? 0;
  const weights = computeStateWeights(cycleSec, phaseName);

  const betOut = { position: _betPos, lookAt: _betLook, fov: 55, roll: 0, stiffness: 3 };
  const spinOut = { position: _spinPos, lookAt: _spinLook, fov: 35, roll: 0, stiffness: 8 };
  const settleOut = { position: _settlePos, lookAt: _settleLook, fov: 22, roll: 0, stiffness: 5 };

  bettingTargets(elapsedTime, betOut);

  const dropProg = THREE.MathUtils.clamp(
    phaseName === 'spinning' ? (cycleSec - BALL_DROP_AT) / 2.5 : 0,
    0,
    1
  );
  const dropVertigo =
    phaseName === 'spinning' && cycleSec >= BALL_DROP_AT
      ? THREE.MathUtils.clamp((cycleSec - BALL_DROP_AT) / 1.2, 0, 1)
      : 0;

  spinDropTargets(ballPos, ballVel, dropProg, spinOut);
  settleTargets(targetNumber, wheelAngle, settleOut);

  // Three-way blend
  _outPos.copy(betOut.position).multiplyScalar(weights.betting);
  _outLook.copy(betOut.lookAt).multiplyScalar(weights.betting);
  let fov = betOut.fov * weights.betting;
  let roll = betOut.roll * weights.betting;
  let stiffness = betOut.stiffness * weights.betting;

  if (weights.spinDrop > 0.001) {
    _outPos.addScaledVector(spinOut.position, weights.spinDrop);
    _outLook.addScaledVector(spinOut.lookAt, weights.spinDrop);
    fov += spinOut.fov * weights.spinDrop;
    roll += spinOut.roll * weights.spinDrop;
    stiffness += spinOut.stiffness * weights.spinDrop;
  }
  if (weights.settle > 0.001) {
    _outPos.addScaledVector(settleOut.position, weights.settle);
    _outLook.addScaledVector(settleOut.lookAt, weights.settle);
    fov += settleOut.fov * weights.settle;
    roll += settleOut.roll * weights.settle;
    stiffness += settleOut.stiffness * weights.settle;
  }

  // Legacy mode hint — rim/drop/chase still influence stiffness during spin
  if (mode === 'rim' || mode === 'drop' || mode === 'chase' || mode === 'slowmo') {
    const hint = CAMERA_MODES[mode];
    if (hint) stiffness = THREE.MathUtils.lerp(stiffness, hint.stiffness, 0.35);
  }

  return {
    position: _outPos.clone(),
    lookAt: _outLook.clone(),
    fov,
    roll,
    stiffness,
    vertigoProgress: Math.max(weights.spinDrop * 0.65, dropVertigo),
    dropVertigoProgress: dropVertigo,
    stateWeights: weights,
  };
}
