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
  lounge: { fov: 48, stiffness: 2.1, dist: 5.2, height: 3.65, lift: 0, roll: 0 },
  tension: { fov: 46, stiffness: 2.4, dist: 4.9, height: 3.45, lift: 0, roll: 0 },
  rim: { fov: 42, stiffness: 3.2, dist: 3.8, height: 3.05, lift: 0, roll: 0 },
  drop: { fov: 40, stiffness: 3.4, dist: 3.5, height: 2.95, lift: 0, roll: 0 },
  chase: { fov: 40, stiffness: 3.6, dist: 3.35, height: 2.85, lift: 0, roll: 0 },
  slowmo: { fov: 36, stiffness: 3, dist: 2.85, height: 2.55, lift: 0, roll: 0 },
  macro: { fov: 32, stiffness: 2.6, dist: 1.05, height: 2.15, lift: 0, roll: 0 },
});

const _betPos = new THREE.Vector3();
const _betLook = new THREE.Vector3();
const _spinPos = new THREE.Vector3();
const _spinLook = new THREE.Vector3();
const _settlePos = new THREE.Vector3();
const _settleLook = new THREE.Vector3();
const _outPos = new THREE.Vector3();
const _outLook = new THREE.Vector3();
const _normal = new THREE.Vector3();

/** Fractional position within the 30s cycle (sub-second precision). */
export function getCycleTimeFloat(nowMs = Date.now()) {
  return (nowMs / 1000) % 30;
}

/**
 * Pocket number used for settle macro framing — authoritative win during reveal, else guide target.
 */
export function resolvePresentationOutcome({
  winningNumber,
  targetNumber,
  settleWeight = 0,
}) {
  const settle = THREE.MathUtils.clamp(settleWeight, 0, 1);
  if (settle > 0.08 && Number.isInteger(winningNumber)) return winningNumber;
  if (Number.isInteger(targetNumber)) return targetNumber;
  return null;
}

/** Cap spring velocity to avoid disorienting snaps after tab resume or phase jumps. */
export const CAMERA_MAX_VELOCITY = 3.2;

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
    const t = THREE.MathUtils.clamp(cycleSecFloat - BALL_DROP_AT, 0, 2.2);
    const ease = 1 - Math.exp(-t * 1.35);
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

/** State 1 — stable casino overview (wheel + felt). */
function bettingTargets(elapsedTime, out) {
  const drift = Math.sin(elapsedTime * 0.12) * 0.22;
  const dist = CAMERA_MODES.lounge.dist;
  out.position.set(0.35 + drift, CAMERA_MODES.lounge.height, dist);
  out.lookAt.set(0, 0.3, 0);
  out.fov = CAMERA_MODES.lounge.fov;
  out.roll = 0;
  out.stiffness = CAMERA_MODES.lounge.stiffness;
}

/**
 * State 2 — elevated 3/4 follow during spin (no rim-hugging chase).
 */
function spinDropTargets(ballPos, dropProgress, out) {
  const p = THREE.MathUtils.clamp(dropProgress, 0, 1);
  const dist = THREE.MathUtils.lerp(CAMERA_MODES.lounge.dist, CAMERA_MODES.chase.dist, p);
  const height = THREE.MathUtils.lerp(CAMERA_MODES.lounge.height, CAMERA_MODES.chase.height, p);
  const side = THREE.MathUtils.lerp(0.55, 1.05, p);

  const bx = THREE.MathUtils.clamp(ballPos?.x ?? 0, -1.1, 1.1);
  const bz = THREE.MathUtils.clamp(ballPos?.z ?? 0, -1.1, 1.1);

  out.position.set(side, height, dist);
  out.lookAt.set(bx * 0.42, 0.32, bz * 0.42);
  out.fov = THREE.MathUtils.lerp(CAMERA_MODES.lounge.fov, CAMERA_MODES.chase.fov, p);
  out.roll = 0;
  out.stiffness = THREE.MathUtils.lerp(CAMERA_MODES.lounge.stiffness, CAMERA_MODES.chase.stiffness, p);
}

/** State 3 — readable pocket focus at settle. */
function settleTargets(targetNumber, wheelAngle, out) {
  if (targetNumber == null) {
    out.position.set(0.2, CAMERA_MODES.macro.height, 2.4);
    out.lookAt.set(0, 0.22, 0);
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

  out.position.set(px + _normal.x * d, CAMERA_MODES.macro.height, pz + _normal.z * d);
  out.lookAt.set(px, 0.14, pz);
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
  winningNumber,
  elapsedTime,
  cycleTimeFloat,
}) {
  const phaseName = clock?.name ?? 'betting';
  const cycleSec = cycleTimeFloat ?? clock?.cycleSecond ?? 0;
  const weights = computeStateWeights(cycleSec, phaseName);
  const presentationOutcome = resolvePresentationOutcome({
    winningNumber,
    targetNumber,
    settleWeight: weights.settle,
  });

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

  spinDropTargets(ballPos, dropProg, spinOut);
  settleTargets(presentationOutcome, wheelAngle, settleOut);

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

  // Legacy mode hint — only during active spin_drop (avoid fighting settle macro)
  if (
    weights.settle < 0.12 &&
    weights.spinDrop > 0.15 &&
    (mode === 'rim' || mode === 'drop' || mode === 'chase' || mode === 'slowmo')
  ) {
    const hint = CAMERA_MODES[mode];
    if (hint) stiffness = THREE.MathUtils.lerp(stiffness, hint.stiffness, 0.28);
  }

  return {
    position: _outPos.clone(),
    lookAt: _outLook.clone(),
    fov,
    roll,
    stiffness,
    vertigoProgress: Math.max(weights.spinDrop * 0.22, dropVertigo * 0.35),
    dropVertigoProgress: dropVertigo,
    stateWeights: weights,
    presentationOutcome,
  };
}
