/**
 * Deterministic ball physics — handoff momentum, slide-roll, pocket capture.
 */
import {
  BALL_PHYSICS,
  POCKET_CAPTURE,
  bowlSurfaceNormal,
} from './wheel.js';

export const CAPTURE_STAGE = Object.freeze({
  GUIDE: 0,
  CAPTURE: 1,
  NESTLE: 2,
  LOCKED: 3,
});

const _tangent = { x: 0, z: 0 };

/**
 * Rolling angular velocity ω from linear velocity v (no-slip on horizontal track).
 * v = ω × r  →  ω_x = v_z/r, ω_z = -v_x/r
 */
export function rollingAngularVelocity(linearVel, ballRadius = BALL_PHYSICS.radius) {
  const invR = 1 / Math.max(ballRadius, 0.001);
  const vx = linearVel.x ?? 0;
  const vz = linearVel.z ?? 0;
  const speed = Math.hypot(vx, vz);
  return {
    x: vz * invR,
    y: speed * invR * 0.06,
    z: -vx * invR,
  };
}

/**
 * Slide-to-roll + rolling resistance + air drag as Rapier impulses (fixed dt).
 */
export function applyRollingKinetics(rb, dt, mass = BALL_PHYSICS.mass) {
  const lv = rb.linvel();
  const av = rb.angvel();
  const vT = Math.hypot(lv.x, lv.z);
  if (vT < 0.002) return;

  const rollOmega = Math.hypot(av.x, av.z) * BALL_PHYSICS.radius;
  const slip = vT - rollOmega;
  const tx = lv.x / vT;
  const tz = lv.z / vT;

  let fx = 0;
  let fz = 0;

  if (slip > 0.018) {
    const frictionImpulse = Math.min(slip * mass * 2.8, vT * mass * 0.35);
    fx -= tx * frictionImpulse;
    fz -= tz * frictionImpulse;
  } else {
    const rr = BALL_PHYSICS.rollingResistance * mass * 9.81 * dt;
    fx -= tx * rr;
    fz -= tz * rr;
  }

  const drag = BALL_PHYSICS.airDrag * vT * mass;
  fx -= tx * drag * dt;
  fz -= tz * drag * dt;

  const t = rb.translation();
  const n = bowlSurfaceNormal(t.x, t.z);
  const slopeG = BALL_PHYSICS.bowlSlope * 9.81 * mass * dt * 0.35;
  fx += n.x * slopeG;
  fz += n.z * slopeG;

  rb.applyImpulse({ x: fx, y: 0, z: fz }, true);

  const targetOmega = rollingAngularVelocity(lv);
  const spinBlend = Math.min(1, dt * 12);
  rb.setAngvel(
    {
      x: av.x + (targetOmega.x - av.x) * spinBlend,
      y: av.y * (1 - dt * 2),
      z: av.z + (targetOmega.z - av.z) * spinBlend,
    },
    true
  );
}

/**
 * PD spring guide toward pocket (stage 0–1).
 */
export function pocketGuideImpulse(
  rb,
  target,
  strength,
  dt,
  stage = CAPTURE_STAGE.GUIDE
) {
  const t = rb.translation();
  const dx = target.x - t.x;
  const dy = target.y - t.y;
  const dz = target.z - t.z;
  const lv = rb.linvel();

  const isCapture = stage >= CAPTURE_STAGE.CAPTURE;
  const k = isCapture ? 28 + strength * 18 : 16 + strength * 12;
  const d = isCapture ? 7.5 + strength * 3 : 4.2 + strength * 2.2;
  const scale = isCapture ? 0.014 + strength * 0.005 : 0.009 + strength * 0.0035;

  rb.applyImpulse(
    {
      x: (dx * k - lv.x * d) * dt * scale,
      y: (dy * k * 1.5 - lv.y * d * 1.2) * dt * scale,
      z: (dz * k - lv.z * d) * dt * scale,
    },
    true
  );
}

/**
 * Critically damped nestle pose — slight bounce envelope for pocket center.
 * @returns {{ x, y, z, done: boolean }}
 */
export function nestlePose(current, target, alpha, dt) {
  const bounce = Math.exp(-alpha * 4.2) * Math.cos(alpha * 9.5) * 0.012 * (1 - alpha);
  const s = 1 - Math.exp(-alpha * 5.5);
  const done = alpha >= 1;

  const bx = Math.sin(target.angle) * bounce;
  const bz = Math.cos(target.angle) * bounce;

  return {
    x: current.x + (target.x - current.x) * s + bx,
    y: current.y + (target.y - current.y) * s,
    z: current.z + (target.z - current.z) * s + bz,
    done,
  };
}

/** Resolve capture stage from distance and speed. */
export function resolveCaptureStage(dist, speed, currentStage) {
  if (currentStage >= CAPTURE_STAGE.NESTLE) return currentStage;
  if (dist < POCKET_CAPTURE.lockRadius * 1.35 && speed < 0.35) return CAPTURE_STAGE.NESTLE;
  if (dist < POCKET_CAPTURE.captureRadius * 1.2 || currentStage >= CAPTURE_STAGE.CAPTURE) {
    return Math.max(currentStage, CAPTURE_STAGE.CAPTURE);
  }
  return CAPTURE_STAGE.GUIDE;
}

console.assert(rollingAngularVelocity({ x: 1, y: 0, z: 0 }).z < 0, 'ω ⊥ v');
