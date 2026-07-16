/**
 * Compact 3D gradient noise (Simplex-style) for organic camera displacement.
 * Based on improved Perlin — deterministic, allocation-free hot path.
 */
import * as THREE from 'three';

const GRAD3 = [
  [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
  [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
  [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
];

const perm = new Uint8Array(512);
for (let i = 0; i < 256; i++) perm[i] = i;
for (let i = 255; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [perm[i], perm[j]] = [perm[j], perm[i]];
}
for (let i = 0; i < 256; i++) perm[i + 256] = perm[i];

function dot3(g, x, y, z) {
  return g[0] * x + g[1] * y + g[2] * z;
}

/** 3D simplex-style noise in [-1, 1]. */
export function simplex3(x, y, z) {
  const F3 = 1 / 3;
  const G3 = 1 / 6;
  const s = (x + y + z) * F3;
  const i = Math.floor(x + s);
  const j = Math.floor(y + s);
  const k = Math.floor(z + s);
  const t = (i + j + k) * G3;
  const x0 = x - (i - t);
  const y0 = y - (j - t);
  const z0 = z - (k - t);

  let i1, j1, k1, i2, j2, k2;
  if (x0 >= y0) {
    if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
    else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
    else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
  } else {
    if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
    else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
    else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
  }

  const ii = i & 255;
  const jj = j & 255;
  const kk = k & 255;

  let n0 = 0, n1 = 0, n2 = 0, n3 = 0;
  let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
  if (t0 > 0) {
    t0 *= t0;
    const gi = perm[ii + perm[jj + perm[kk]]] % 12;
    n0 = t0 * t0 * dot3(GRAD3[gi], x0, y0, z0);
  }
  const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3;
  let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
  if (t1 > 0) {
    t1 *= t1;
    const gi = perm[ii + i1 + perm[jj + j1 + perm[kk + k1]]] % 12;
    n1 = t1 * t1 * dot3(GRAD3[gi], x1, y1, z1);
  }
  const x2 = x0 - i2 + 2 * G3, y2 = y0 - j2 + 2 * G3, z2 = z0 - k2 + 2 * G3;
  let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
  if (t2 > 0) {
    t2 *= t2;
    const gi = perm[ii + i2 + perm[jj + j2 + perm[kk + k2]]] % 12;
    n2 = t2 * t2 * dot3(GRAD3[gi], x2, y2, z2);
  }
  const x3 = x0 - 1 + 3 * G3, y3 = y0 - 1 + 3 * G3, z3 = z0 - 1 + 3 * G3;
  let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
  if (t3 > 0) {
    t3 *= t3;
    const gi = perm[ii + 1 + perm[jj + 1 + perm[kk + 1]]] % 12;
    n3 = t3 * t3 * dot3(GRAD3[gi], x3, y3, z3);
  }

  return 32 * (n0 + n1 + n2 + n3);
}

const _out = new THREE.Vector3();

/** Multi-octave simplex displacement for handheld camera rig. */
export function handheldSimplex(t, amplitude = 0.02) {
  const s = t * 0.85;
  _out.set(
    simplex3(s * 1.1, 0.3, 1.7) * 0.55 +
      simplex3(s * 2.3, 1.2, 0.8) * 0.3 +
      simplex3(s * 0.5, 2.1, 0.4) * 0.15,
    simplex3(s * 0.9, 1.8, 0.6) * 0.55 +
      simplex3(s * 1.9, 0.4, 2.2) * 0.3 +
      simplex3(s * 0.7, 1.1, 1.3) * 0.15,
    simplex3(s * 1.3, 0.7, 1.1) * 0.55 +
      simplex3(s * 2.1, 1.6, 0.5) * 0.3 +
      simplex3(s * 0.6, 0.9, 2.0) * 0.15
  );
  return _out.multiplyScalar(amplitude);
}

const _breathOut = new THREE.Vector3();

/**
 * Low-frequency operator breathing — multi-octave sine (lens-body micro-vibration).
 */
export function operatorBreathing(t, amplitude = 0.006) {
  const s = t;
  _breathOut.set(
    Math.sin(s * 0.41) * 0.5 + Math.sin(s * 0.93) * 0.28 + Math.sin(s * 1.67) * 0.12,
    Math.sin(s * 0.37 + 1.2) * 0.45 + Math.sin(s * 0.81) * 0.3 + Math.sin(s * 1.43) * 0.1,
    Math.sin(s * 0.33 + 0.7) * 0.4 + Math.sin(s * 0.77 + 2.1) * 0.32 + Math.sin(s * 1.51) * 0.11
  );
  return _breathOut.multiplyScalar(amplitude);
}
