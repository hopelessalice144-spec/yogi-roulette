/**
 * Lazy Rapier WASM loader — defers ~838KB gzip chunk until pre-spin window.
 */

import { markProfile, measureProfile } from '../core/profileHarness.js';

let rapierModulePromise = null;
let rapierStagePromise = null;

/** Begin downloading @react-three/rapier (idempotent). */
export function prefetchRapier() {
  if (!rapierModulePromise) {
    markProfile('rapier-prefetch-start');
    rapierModulePromise = import('@react-three/rapier').then((mod) => {
      measureProfile('rapier-wasm-load', 'rapier-prefetch-start');
      return mod;
    });
  }
  return rapierModulePromise;
}

/** Dynamic import of the physics scene subtree. */
export function loadRapierStage() {
  if (!rapierStagePromise) {
    markProfile('rapier-stage-start');
    rapierStagePromise = prefetchRapier().then(() =>
      import('../scene/RapierStage.jsx').then((mod) => {
        measureProfile('rapier-stage-load', 'rapier-stage-start');
        return mod;
      })
    );
  }
  return rapierStagePromise;
}

/** True when WASM module fetch has resolved. */
export async function isRapierReady() {
  if (!rapierModulePromise) return false;
  try {
    await rapierModulePromise;
    return true;
  } catch {
    return false;
  }
}

/** Seconds before lock when prefetch should begin (betting phase). */
export const RAPIER_PREFETCH_AT = 17;

/** Clear cached WASM/stage promises after WebGL context loss. */
export function resetRapierCache() {
  rapierModulePromise = null;
  rapierStagePromise = null;
}

/** Whether the live physics stage should mount for this clock snapshot. */
export function shouldMountPhysics(clock) {
  if (!clock) return false;
  return clock.name === 'locked' || clock.name === 'spinning';
}

/** Whether to start prefetching WASM during late betting. */
export function shouldPrefetchPhysics(clock) {
  if (!clock) return false;
  if (clock.name === 'locked' || clock.name === 'spinning') return true;
  return clock.name === 'betting' && clock.cycleSecond >= RAPIER_PREFETCH_AT;
}

console.assert(shouldPrefetchPhysics({ name: 'betting', cycleSecond: 17 }), 'prefetch at T-13');
