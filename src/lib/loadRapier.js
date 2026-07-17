/**
 * Lazy Rapier WASM loader — defers ~838KB gzip chunk until pre-spin window.
 */

import { markProfile, measureProfile } from '../core/profileHarness.js';
import {
  getRapierModulePromise,
  getRapierStagePromise,
  setRapierModulePromise,
  setRapierStagePromise,
} from './rapierCache.js';

/** Begin downloading @react-three/rapier (idempotent). */
export function prefetchRapier() {
  let rapierModulePromise = getRapierModulePromise();
  if (!rapierModulePromise) {
    markProfile('rapier-prefetch-start');
    rapierModulePromise = import('@react-three/rapier').then((mod) => {
      measureProfile('rapier-wasm-load', 'rapier-prefetch-start');
      return mod;
    });
    setRapierModulePromise(rapierModulePromise);
  }
  return rapierModulePromise;
}

/** Dynamic import of the physics scene subtree. */
export function loadRapierStage() {
  let rapierStagePromise = getRapierStagePromise();
  if (!rapierStagePromise) {
    markProfile('rapier-stage-start');
    rapierStagePromise = prefetchRapier().then(() =>
      import('../scene/RapierStage.jsx').then((mod) => {
        measureProfile('rapier-stage-load', 'rapier-stage-start');
        return mod;
      })
    );
    setRapierStagePromise(rapierStagePromise);
  }
  return rapierStagePromise;
}

/** True when WASM module fetch has resolved. */
export async function isRapierReady() {
  const rapierModulePromise = getRapierModulePromise();
  if (!rapierModulePromise) return false;
  try {
    await rapierModulePromise;
    return true;
  } catch {
    return false;
  }
}

/** True when the RapierStage dynamic import has resolved. */
export async function isRapierStageReady() {
  const rapierStagePromise = getRapierStagePromise();
  if (!rapierStagePromise) return false;
  try {
    await rapierStagePromise;
    return true;
  } catch {
    return false;
  }
}

/** Seconds before lock when prefetch should begin (betting phase). */
export const RAPIER_PREFETCH_AT = 17;

/** Earlier prefetch on low tier — more time for WASM on constrained devices. */
export const RAPIER_PREFETCH_AT_LOW = 15;

/** Slightly earlier on medium tier — balances bandwidth vs. spin readiness. */
export const RAPIER_PREFETCH_AT_MEDIUM = 16;

/** Clear cached WASM/stage promises after WebGL context loss. */
export { resetRapierCache } from './rapierCache.js';

/** Whether the live physics stage should mount for this clock snapshot. */
export function shouldMountPhysics(clock) {
  if (!clock) return false;
  return clock.name === 'locked' || clock.name === 'spinning';
}

/** Betting-phase second when prefetch should start for the given quality tier. */
export function rapierPrefetchAt(qualityTier = 'high') {
  if (qualityTier === 'low') return RAPIER_PREFETCH_AT_LOW;
  if (qualityTier === 'medium') return RAPIER_PREFETCH_AT_MEDIUM;
  return RAPIER_PREFETCH_AT;
}

/** Whether to start prefetching WASM during late betting. */
export function shouldPrefetchPhysics(clock, qualityTier = 'high') {
  if (!clock) return false;
  if (clock.name === 'locked' || clock.name === 'spinning') return true;
  const prefetchAt = rapierPrefetchAt(qualityTier);
  return clock.name === 'betting' && clock.cycleSecond >= prefetchAt;
}

console.assert(shouldPrefetchPhysics({ name: 'betting', cycleSecond: 17 }), 'prefetch at T-13');
console.assert(
  shouldPrefetchPhysics({ name: 'betting', cycleSecond: 15 }, 'low'),
  'low-tier prefetch at T-15'
);
console.assert(
  shouldPrefetchPhysics({ name: 'betting', cycleSecond: 16 }, 'medium'),
  'medium-tier prefetch at T-14'
);
