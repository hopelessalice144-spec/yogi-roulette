import { computeBallKinematicSync, computeWheelAngleSync } from './cycleResync.js';

/**
 * @param {object} params
 * @param {object} params.clockSnap
 * @param {number} params.wheelAngle
 * @param {number} params.wheelSpinSpeed
 * @param {boolean} [params.syncWheel]
 */
export function buildPresentationResync({
  clockSnap,
  wheelAngle,
  wheelSpinSpeed,
  syncWheel = false,
}) {
  const kinematic = computeBallKinematicSync(clockSnap, wheelAngle, wheelSpinSpeed);
  const nextWheelAngle = syncWheel ? computeWheelAngleSync(clockSnap, wheelSpinSpeed) : wheelAngle;
  return {
    kinematic,
    wheelAngle: nextWheelAngle,
    syncWheel,
  };
}
