/**
 * Smooth wheel spin velocity blending with end-of-cycle deceleration.
 */

/** Exponential damp toward target spin speed (frame-rate independent). */
export function dampSpinVelocity(current, target, lambda, delta) {
  const t = 1 - Math.exp(-lambda * delta);
  return current + (target - current) * t;
}

/** Ease-out deceleration during guided capture (cycle seconds 28–29). */
export function applyGuidedDeceleration(velocity, cycleSecond, guideStart = 28, settleAt = 29) {
  if (cycleSecond < guideStart) return velocity;
  const span = Math.max(0.001, settleAt - guideStart);
  const t = Math.min(1, (cycleSecond - guideStart) / span);
  const ease = 1 - (1 - t) ** 2.6;
  return velocity * (1 - ease * 0.52);
}

/** Blend target speed with phase-aware damping and late-spin slowdown. */
export function blendWheelSpinVelocity(current, target, delta, cycleSecond = 0) {
  const lambda = cycleSecond >= 25 ? 3.2 : cycleSecond >= 20 ? 4 : 3.6;
  let next = dampSpinVelocity(current, target, lambda, delta);
  next = applyGuidedDeceleration(next, cycleSecond);
  return next;
}
