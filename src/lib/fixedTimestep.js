/**
 * Fixed-timestep accumulator — framerate-independent simulation steps.
 */
export const FIXED_TIMESTEP = 1 / 60;
export const MAX_PHYSICS_SUBSTEPS = 5;
export const MAX_FRAME_DELTA = 0.1;

export function createTimestepAccumulator() {
  return { value: 0 };
}

/**
 * Consume frame delta in fixed increments. Returns number of steps executed.
 */
export function runFixedSteps(accumulator, delta, stepFn) {
  accumulator.value += Math.min(Math.max(delta, 0), MAX_FRAME_DELTA);
  let steps = 0;
  while (accumulator.value >= FIXED_TIMESTEP && steps < MAX_PHYSICS_SUBSTEPS) {
    accumulator.value -= FIXED_TIMESTEP;
    stepFn(FIXED_TIMESTEP);
    steps += 1;
  }
  return steps;
}
