/**
 * Runtime performance marks — dev HUD + verify harness + vitals store.
 */

/** @typedef {{ value: number, rating?: string, at: number, [key: string]: unknown }} VitalEntry */

const marks = new Map();

export const profileSnapshot = {
  rapierWasmMs: null,
  rapierStageMs: null,
  marks: /** @type {Record<string, number>} */ ({}),
  vitals: /** @type {Record<string, VitalEntry>} */ ({}),
};

export function markProfile(name) {
  const t = typeof performance !== 'undefined' ? performance.now() : Date.now();
  marks.set(name, t);
  profileSnapshot.marks[name] = t;
}

export function measureProfile(name, startMark) {
  const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const start = marks.get(startMark);
  if (start == null) return null;
  const duration = Math.round(end - start);
  profileSnapshot.marks[name] = duration;
  if (name === 'rapier-wasm-load') profileSnapshot.rapierWasmMs = duration;
  if (name === 'rapier-stage-load') profileSnapshot.rapierStageMs = duration;
  return duration;
}

/** Record a Web Vital or custom metric into the shared snapshot. */
export function recordVital(name, value, extras = {}) {
  if (!Number.isFinite(value)) return;
  profileSnapshot.vitals[name] = {
    value: Math.round(value * 1000) / 1000,
    at: Date.now(),
    ...extras,
  };
}

/** Immutable snapshot for HUD / telemetry beacon. */
export function getVitalsSnapshot() {
  return {
    rapierWasmMs: profileSnapshot.rapierWasmMs,
    rapierStageMs: profileSnapshot.rapierStageMs,
    marks: { ...profileSnapshot.marks },
    vitals: { ...profileSnapshot.vitals },
  };
}

export function resetProfileSnapshot() {
  marks.clear();
  profileSnapshot.rapierWasmMs = null;
  profileSnapshot.rapierStageMs = null;
  profileSnapshot.marks = {};
  profileSnapshot.vitals = {};
}

console.assert(typeof markProfile === 'function', 'profile harness');
recordVital('verify-self-test', 1, { rating: 'good' });
console.assert(profileSnapshot.vitals['verify-self-test']?.value === 1, 'recordVital stores metric');
delete profileSnapshot.vitals['verify-self-test'];
