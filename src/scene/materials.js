/** VIP casino PBR presets — wet lacquer, bullion metals, dense ivory. */

export const MAHOGANY_LACQUER = {
  color: '#1a0508',
  roughness: 0.028,
  metalness: 0.05,
  clearcoat: 1.0,
  clearcoatRoughness: 0.006,
  sheen: 0.42,
  sheenRoughness: 0.14,
  sheenColor: '#5c1828',
  envMapIntensity: 1.72,
  iridescence: 0.12,
  iridescenceIOR: 1.28,
};

export const LUXURY_GOLD = {
  color: '#f2d480',
  roughness: 0.022,
  metalness: 0.99,
  clearcoat: 1.0,
  clearcoatRoughness: 0.012,
  envMapIntensity: 2.05,
  anisotropy: 0.48,
  anisotropyRotation: 0.31,
};

export const SPINDLE_APEX = {
  color: '#fff6d4',
  roughness: 0.028,
  metalness: 0.99,
  clearcoat: 1.0,
  clearcoatRoughness: 0.015,
  envMapIntensity: 2.0,
  anisotropy: 0.22,
};

export const POLISHED_IVORY_CHROME = {
  color: '#f6f2ea',
  roughness: 0.042,
  metalness: 0.22,
  envMapIntensity: 1.75,
};

export const POCKET_FELT = {
  red: {
    color: '#8a1220',
    roughness: 0.24,
    metalness: 0.2,
    clearcoat: 0.62,
    clearcoatRoughness: 0.09,
    envMapIntensity: 0.95,
  },
  black: {
    color: '#06060c',
    roughness: 0.18,
    metalness: 0.28,
    clearcoat: 0.58,
    clearcoatRoughness: 0.08,
    envMapIntensity: 0.9,
  },
  green: {
    color: '#0a5238',
    roughness: 0.22,
    metalness: 0.18,
    clearcoat: 0.6,
    clearcoatRoughness: 0.09,
    envMapIntensity: 0.92,
  },
};

export const BOWL_METAL = {
  color: '#0e0a08',
  roughness: 0.14,
  metalness: 0.82,
  clearcoat: 0.82,
  clearcoatRoughness: 0.05,
  envMapIntensity: 1.25,
};

export const TABLE_FELT = {
  color: '#052a22',
  roughness: 0.64,
  metalness: 0.08,
  clearcoat: 0.42,
  clearcoatRoughness: 0.22,
  envMapIntensity: 0.75,
};

export const NEON_RING = {
  color: '#00e8c8',
  emissive: '#00e8c8',
  emissiveIntensity: 0.45,
  roughness: 0.15,
  metalness: 0.15,
  transparent: true,
  opacity: 0.9,
  toneMapped: false,
};

export const PLINTH_METAL = {
  color: '#0a0812',
  roughness: 0.22,
  metalness: 0.78,
  clearcoat: 0.65,
  clearcoatRoughness: 0.09,
  envMapIntensity: 1.1,
};

export function dampFactor(lambda, delta) {
  return 1 - Math.exp(-lambda * delta);
}

/** Cubic ease-out for silky kinematic transitions. */
export function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

/** Smooth ease-in-out for descent handoff continuity. */
export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/** Critically damped spring step toward target. */
export function springStep(current, target, velocity, stiffness, damping, dt) {
  const force = (target - current) * stiffness;
  const damp = velocity * damping;
  const accel = force - damp;
  const nextVel = velocity + accel * dt;
  const nextPos = current + nextVel * dt;
  return [nextPos, nextVel];
}
