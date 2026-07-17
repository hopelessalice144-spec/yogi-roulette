/**
 * Wall-clock ball kinematics — single source for orbit, descent, and resync.
 */
import {
  CYCLE_SECONDS,
  BALL_DROP_AT,
  BALL_PHYSICS_AT,
  BALL_SETTLE_AT,
} from '@core/timer.js';
import { resolveGameState } from './gamePhase.js';
import {
  ORBIT_ANGULAR_BASE,
  ORBIT_RADIUS,
  ORBIT_Y,
  orbitPose,
  descentPose,
  physicsHandoff,
} from './trajectory.js';

export function orbitAngularSpeed(wheelSpinSpeed = 0) {
  return ORBIT_ANGULAR_BASE + wheelSpinSpeed * 0.15;
}

/** Continuous time within the 30s cycle (includes sub-second when nowMs is set). */
export function cycleTimeSec(clock) {
  if (clock?.nowMs != null) {
    return (clock.nowMs / 1000) % CYCLE_SECONDS;
  }
  return clock?.cycleSecond ?? 0;
}

export function orbitAngleAtCycleTime(cycleTime, wheelSpinSpeed) {
  return (cycleTime * orbitAngularSpeed(wheelSpinSpeed)) % (Math.PI * 2);
}

export function descentProgressAtClock(clock) {
  const t = cycleTimeSec(clock);
  if (t < BALL_DROP_AT) return 0;
  const span = Math.max(0.001, BALL_PHYSICS_AT - BALL_DROP_AT);
  return Math.min(1, (t - BALL_DROP_AT) / span);
}

export function dropOrbitAngle(wheelSpinSpeed) {
  return orbitAngleAtCycleTime(BALL_DROP_AT, wheelSpinSpeed);
}

/**
 * Kinematic ball state derived from HUD clock — matches visual + physics orbit/descent.
 * @param {boolean} [wheelLocal] — wheel group already applies rotation (use 0 in orbitPose).
 */
export function resolveKinematicBallState(
  clock,
  wheelAngle = 0,
  wheelSpinSpeed = 0.42,
  { wheelLocal = false } = {},
) {
  const state = resolveGameState(clock);
  const phase = state.ballPhase;
  const spin = state.wheelSpinSpeed ?? wheelSpinSpeed;
  const wa = wheelLocal ? 0 : wheelAngle;
  const t = cycleTimeSec(clock);

  if (phase === 'orbit') {
    const orbitAngle = orbitAngleAtCycleTime(t, spin);
    const pose = orbitPose(orbitAngle, wa, spin);
    return {
      phase,
      orbitAngle,
      descentT: 0,
      position: { x: pose.x, y: pose.y, z: pose.z },
      velocity: null,
      forceGuidedLock: false,
    };
  }

  if (phase === 'descent') {
    const orbitAngle = dropOrbitAngle(spin);
    const descentT = descentProgressAtClock(clock);
    const pose = descentPose(descentT, orbitAngle, wa, spin);
    return {
      phase,
      orbitAngle,
      descentT,
      position: { x: pose.x, y: pose.y, z: pose.z },
      velocity: null,
      forceGuidedLock: false,
    };
  }

  if (phase === 'free') {
    const orbitAngle = dropOrbitAngle(spin);
    const handoff = physicsHandoff(orbitAngle, wa, spin, 1);
    return {
      phase,
      orbitAngle,
      descentT: 1,
      position: { x: handoff.x, y: handoff.y, z: handoff.z },
      velocity: handoff.velocity,
      forceGuidedLock: false,
    };
  }

  const orbitAngle = dropOrbitAngle(spin);
  return {
    phase,
    orbitAngle,
    descentT: 1,
    position: null,
    velocity: null,
    forceGuidedLock: clock.cycleSecond >= BALL_SETTLE_AT - 1,
  };
}

/** Tangential m/s for visual roll on the rim. */
export function rimTangentialVelocity(pose) {
  const tangential = pose.angular * ORBIT_RADIUS;
  return {
    x: Math.cos(pose.angle) * tangential,
    y: 0,
    z: -Math.sin(pose.angle) * tangential,
    speed: tangential,
  };
}

console.assert(orbitAngularSpeed(0) === ORBIT_ANGULAR_BASE, 'orbit angular base');
console.assert(ORBIT_Y > 0 && ORBIT_RADIUS > 0, 'orbit dims');
