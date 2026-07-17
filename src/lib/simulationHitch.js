/**
 * Frame hitch detection — wall-clock resync instead of multi-step physics tunneling.
 */
export const PHYSICS_HITCH_DELTA = 0.2;
export const POST_HITCH_FRAME_DELTA = 1 / 60;

export function isPhysicsHitch(delta) {
  return delta > PHYSICS_HITCH_DELTA;
}

/** Delta passed to fixed-step integrators after a hitch resync. */
export function postHitchSimulationDelta(delta) {
  return isPhysicsHitch(delta) ? POST_HITCH_FRAME_DELTA : delta;
}

console.assert(isPhysicsHitch(0.25), 'hitch threshold');
console.assert(!isPhysicsHitch(0.1), 'normal frame');
