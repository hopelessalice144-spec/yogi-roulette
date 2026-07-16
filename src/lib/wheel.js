/**
 * European wheel layout — standard clockwise sequence from 0.
 */

export const EUROPEAN_SEQUENCE = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
  24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

export const POCKET_COUNT = EUROPEAN_SEQUENCE.length;
export const POCKET_ANGLE = (Math.PI * 2) / POCKET_COUNT;

export const WHEEL = Object.freeze({
  outerRadius: 1.38,
  rimRadius: 1.32,
  trackRadius: 1.18,
  pocketInner: 0.88,
  bowlRadius: 0.72,
  hubRadius: 0.2,
  height: 0.2,
  dividerThickness: 0.018,
  dividerHeight: 0.14,
});

/** Polished ivory sphere — deterministic Rapier material preset. */
export const BALL_PHYSICS = Object.freeze({
  mass: 0.062,
  radius: 0.04,
  /** Ivory on brass divider pins */
  restitution: 0.56,
  friction: 0.64,
  /** Rolling resistance + air drag (Rapier linear damping) */
  linearDamping: 0.11,
  angularDamping: 0.17,
  /** Tangential deceleration coefficient (slide→roll + rolling resistance) */
  rollingResistance: 0.0092,
  airDrag: 0.0045,
  /** Bowl slope — track tilts inward toward pocket floor */
  bowlSlope: 0.14,
});

/** Pocket capture channels — dual-stage spring radii (meters). */
export const POCKET_CAPTURE = Object.freeze({
  guideRadius: 0.14,
  captureRadius: 0.052,
  lockRadius: 0.034,
  nestleY: 0.102,
  pocketMidRadius: (WHEEL.trackRadius + WHEEL.pocketInner) * 0.5,
});

/** Pocket index (0–36) → center angle on XZ plane (0 = +Z). */
export function pocketIndexToAngle(index) {
  return index * POCKET_ANGLE + POCKET_ANGLE * 0.5;
}

export function numberToPocketIndex(number) {
  const idx = EUROPEAN_SEQUENCE.indexOf(number);
  if (idx < 0) throw new Error(`Invalid number: ${number}`);
  return idx;
}

export function pocketIndexToNumber(index) {
  return EUROPEAN_SEQUENCE[index];
}

export function angleToPocketIndex(angle) {
  const normalized = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const idx = Math.floor(normalized / POCKET_ANGLE) % POCKET_COUNT;
  return idx;
}

export function positionOnRing(radius, angle, y = 0.12) {
  return [Math.sin(angle) * radius, y, Math.cos(angle) * radius];
}

/** World-space pocket center for capture / nestle. */
export function pocketCenterWorld(pocketIndex, wheelAngle, y = POCKET_CAPTURE.nestleY) {
  const angle = pocketIndexToAngle(pocketIndex) + wheelAngle;
  const r = POCKET_CAPTURE.pocketMidRadius;
  return {
    x: Math.sin(angle) * r,
    y,
    z: Math.cos(angle) * r,
    angle,
  };
}

/** Inward bowl normal at track radius (for slope gravity projection). */
export function bowlSurfaceNormal(x, z) {
  const r = Math.hypot(x, z) || 1;
  const nx = -x / r;
  const nz = -z / r;
  const ny = BALL_PHYSICS.bowlSlope;
  const len = Math.hypot(nx, ny, nz) || 1;
  return { x: nx / len, y: ny / len, z: nz / len };
}

console.assert(EUROPEAN_SEQUENCE.length === 37, '37 pockets');
console.assert(EUROPEAN_SEQUENCE[0] === 0, 'starts at 0');
console.assert(new Set(EUROPEAN_SEQUENCE).size === 37, 'all unique');
console.assert(BALL_PHYSICS.mass === 0.062, 'ivory mass');
