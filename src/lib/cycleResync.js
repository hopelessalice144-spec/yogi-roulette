/**
 * Wall-clock cycle resync — reconstruct game phase from absolute time.
 */
import {
  getCycleId,
  getPhase,
  BALL_DROP_AT,
} from '@core/timer.js';
import { resolveKinematicBallState } from './ballKinematics.js';
import { resolveGameState } from './gamePhase.js';

export function wallClockSnapshot(nowMs = Date.now()) {
  return {
    ...getPhase(nowMs),
    cycleId: getCycleId(nowMs),
    nowMs,
  };
}

/** Deterministic ball kinematic snapshot for tab-resume teleport. */
export function computeBallKinematicSync(clock, wheelAngle = 0, wheelSpinSpeed = 0.42) {
  const kin = resolveKinematicBallState(clock, wheelAngle, wheelSpinSpeed);
  return {
    phase: kin.phase,
    orbitAngle: kin.orbitAngle,
    descentT: kin.descentT,
    position: kin.position,
    forceGuidedLock: kin.forceGuidedLock,
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
  return (ms / 1000) * speed;
}

console.assert(wallClockSnapshot().cycleId >= 0, 'wall clock snapshot');
