/**
 * Wall-clock cycle resync — reconstruct game phase from absolute time.
 */
import {
  getCycleId,
  getPhase,
  BALL_SETTLE_AT,
  BALL_DROP_AT,
  BALL_PHYSICS_AT,
  CYCLE_SECONDS,
} from '@core/timer.js';
import { resolveGameState } from './gamePhase.js';
import { ORBIT_ANGULAR_BASE, ORBIT_RADIUS, ORBIT_Y, descentPose, orbitPose } from './trajectory.js';

export function wallClockSnapshot(nowMs = Date.now()) {
  return {
    ...getPhase(nowMs),
    cycleId: getCycleId(nowMs),
    nowMs,
  };
}

/** Deterministic ball kinematic snapshot for tab-resume teleport. */
export function computeBallKinematicSync(clock, wheelAngle = 0, wheelSpinSpeed = 0.42) {
  const state = resolveGameState(clock);
  const phase = state.ballPhase;
  const spin = state.wheelSpinSpeed ?? wheelSpinSpeed;

  if (phase === 'orbit') {
    const orbitAngle = (clock.cycleSecond * ORBIT_ANGULAR_BASE * 1.1) % (Math.PI * 2);
    const pose = orbitPose(orbitAngle, wheelAngle, spin);
    return {
      phase,
      orbitAngle,
      descentT: 0,
      position: { x: pose.x, y: pose.y, z: pose.z },
      forceGuidedLock: false,
    };
  }

  if (phase === 'descent') {
    const span = Math.max(0.001, BALL_PHYSICS_AT - BALL_DROP_AT);
    const descentT = Math.min(1, Math.max(0, (clock.cycleSecond - BALL_DROP_AT) / span));
    const orbitAngle = (BALL_DROP_AT * ORBIT_ANGULAR_BASE) % (Math.PI * 2);
    const pose = descentPose(descentT, orbitAngle, wheelAngle, spin);
    return {
      phase,
      orbitAngle,
      descentT,
      position: { x: pose.x, y: pose.y, z: pose.z },
      forceGuidedLock: false,
    };
  }

  if (phase === 'free') {
    const orbitAngle = (BALL_DROP_AT * ORBIT_ANGULAR_BASE) % (Math.PI * 2);
    const angle = orbitAngle + wheelAngle;
    return {
      phase,
      orbitAngle,
      descentT: 1,
      position: {
        x: Math.sin(angle) * (ORBIT_RADIUS - 0.05),
        y: ORBIT_Y - 0.04,
        z: Math.cos(angle) * (ORBIT_RADIUS - 0.05),
      },
      forceGuidedLock: false,
    };
  }

  // guided / settle — force lock lerp target
  return {
    phase,
    orbitAngle: (BALL_DROP_AT * ORBIT_ANGULAR_BASE) % (Math.PI * 2),
    descentT: 1,
    position: null,
    forceGuidedLock: clock.cycleSecond >= BALL_SETTLE_AT - 1,
  };
}

/** True if a betting round settle was skipped while tab was hidden. */
export function missedSettleCycle(clock, settledCycleId, hasBets) {
  if (!hasBets) return null;
  const { cycleId, cycleSecond } = clock;
  if (settledCycleId === cycleId) return null;
  if (cycleSecond < BALL_DROP_AT && (settledCycleId == null || settledCycleId < cycleId)) {
    return Math.max(0, cycleId - 1);
  }
  return null;
}

/** Snap wheel rotation to wall-clock epoch (seamless tab-resume). */
export function computeWheelAngleSync(clock, spinSpeed = 0.42) {
  const state = resolveGameState(clock);
  const speed = state.wheelSpinSpeed ?? spinSpeed;
  const ms = clock.nowMs ?? Date.now();
  const absoluteSec = ms / 1000;
  const cycleFrac = (clock.cycleSecond + (ms % 1000) / 1000) / CYCLE_SECONDS;
  return absoluteSec * speed * 0.94 + cycleFrac * Math.PI * 0.35;
}

console.assert(wallClockSnapshot().cycleId >= 0, 'wall clock snapshot');
