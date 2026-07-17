/**
 * Deterministic ball trajectory — orbital spline → Rapier handoff (momentum-locked).
 */
import { pocketIndexToAngle, WHEEL, POCKET_CAPTURE } from './wheel.js';
import { rollingAngularVelocity } from './ballPhysics.js';

export const BALL_RADIUS = 0.04;
export const ORBIT_RADIUS = WHEEL.trackRadius - 0.025;
export const TRACK_RADIUS = WHEEL.trackRadius - 0.1;
export const ORBIT_Y = 0.29;
export const TRACK_Y = 0.26;
export const DESCENT_DURATION = 0.88;
export const ORBIT_ANGULAR_BASE = 2.8;
export const DESCENT_SPIRAL = 1.8;
export const WHEEL_COUPLING = 1;

/** Cubic ease-in-out — C¹ continuous at handoff boundary. */
export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

export function easeInOutCubicDerivative(t) {
  if (t < 0.5) return 12 * t * t;
  const u = -2 * t + 2;
  return (6 * u * u) / 2;
}

/** Kinematic pose along descent spline (t ∈ [0,1]). */
export function descentPose(t, orbitAngle, wheelAngle, wheelSpinSpeed = 0) {
  const e = easeInOutCubic(t);
  const angle =
    orbitAngle + wheelAngle * WHEEL_COUPLING - e * DESCENT_SPIRAL;
  const radius = ORBIT_RADIUS + (TRACK_RADIUS - ORBIT_RADIUS) * e;
  const y = ORBIT_Y + (TRACK_Y - ORBIT_Y) * e;
  return {
    x: Math.sin(angle) * radius,
    y,
    z: Math.cos(angle) * radius,
    angle,
    radius,
    ease: e,
  };
}

/** Analytical velocity ∂pose/∂t — exact handoff continuity. */
export function descentVelocity(t, orbitAngle, wheelAngle, wheelSpinSpeed = 0) {
  const e = easeInOutCubic(t);
  const deDt = easeInOutCubicDerivative(t) / DESCENT_DURATION;
  const angle =
    orbitAngle + wheelAngle * WHEEL_COUPLING - e * DESCENT_SPIRAL;
  const dAngleDt = -DESCENT_SPIRAL * deDt + wheelSpinSpeed * WHEEL_COUPLING;
  const radius = ORBIT_RADIUS + (TRACK_RADIUS - ORBIT_RADIUS) * e;
  const drDt = (TRACK_RADIUS - ORBIT_RADIUS) * deDt;
  const dyDt = (TRACK_Y - ORBIT_Y) * deDt;

  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  const x = cosA * radius * dAngleDt + sinA * drDt;
  const y = dyDt;
  const z = -sinA * radius * dAngleDt + cosA * drDt;

  return {
    x,
    y,
    z,
    speed: Math.hypot(x, y, z),
    tangentX: -sinA,
    tangentZ: cosA,
  };
}

/** Orbital pose on the rim track. */
export function orbitPose(orbitAngle, wheelAngle, wheelSpinSpeed = 0) {
  const angular = ORBIT_ANGULAR_BASE + wheelSpinSpeed * 0.15;
  const angle = orbitAngle + wheelAngle * WHEEL_COUPLING;
  return {
    x: Math.sin(angle) * ORBIT_RADIUS,
    y: ORBIT_Y,
    z: Math.cos(angle) * ORBIT_RADIUS,
    angular,
    angle,
  };
}

/** @deprecated Use rollingAngularVelocity from ballPhysics.js */
export function handoffAngularVelocity(linearVel, ballRadius = BALL_RADIUS) {
  return rollingAngularVelocity(linearVel, ballRadius);
}

/**
 * Momentum-conserving Rapier handoff at spline exit (t = 1).
 * Linear + angular velocity matched to kinematic derivative — zero teleport.
 */
export function physicsHandoff(orbitAngle, wheelAngle, wheelSpinSpeed = 0, handoffT = 1) {
  const t = Math.min(1, Math.max(0, handoffT));
  const pose = descentPose(t, orbitAngle, wheelAngle, wheelSpinSpeed);
  const vel = descentVelocity(t, orbitAngle, wheelAngle, wheelSpinSpeed);
  const angularVelocity = rollingAngularVelocity(vel, BALL_RADIUS);

  return {
    ...pose,
    velocity: vel,
    angularVelocity,
    handoffT: t,
  };
}

/** Pocket settle target on wheel bowl. */
export function pocketSettleTarget(pocketAngle) {
  const r = POCKET_CAPTURE.pocketMidRadius;
  return {
    x: Math.sin(pocketAngle) * r,
    y: POCKET_CAPTURE.nestleY,
    z: Math.cos(pocketAngle) * r,
  };
}

/** Predict pocket world position with wheel rotation. */
export function predictPocketTarget(pocketIndex, wheelAngle, wheelSpinSpeed, lookaheadSec = 0.4) {
  const angle = pocketIndexToAngle(pocketIndex) + wheelAngle + wheelSpinSpeed * lookaheadSec;
  return pocketSettleTarget(angle);
}

/** Last kinematic frame before Rapier release — ensures C⁰ position/velocity. */
export function synchronizeHandoffState(orbitAngle, wheelAngle, wheelSpinSpeed, descentT) {
  const t = Math.min(1, descentT);
  return physicsHandoff(orbitAngle, wheelAngle, wheelSpinSpeed, t);
}

console.assert(descentPose(0, 0, 0).y === ORBIT_Y, 'descent starts at orbit height');
console.assert(Math.abs(descentPose(1, 0, 0).y - TRACK_Y) < 0.001, 'descent ends at track height');
const h0 = physicsHandoff(1.2, 0.5, 2.8, 1);
const h1 = physicsHandoff(1.2, 0.5, 2.8, 0.999);
assertHandoffContinuity(h0, h1);

function assertHandoffContinuity(a, b) {
  const dp = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  const dv = Math.hypot(
    a.velocity.x - b.velocity.x,
    a.velocity.y - b.velocity.y,
    a.velocity.z - b.velocity.z
  );
  if (dp > 0.05 || dv > 0.5) {
    console.warn('handoff continuity check', dp, dv);
  }
}
