/**
 * Performance budgets — single source for adaptive quality + build targets.
 */

import { APP_CONFIG } from './config.js';

export const FPS_BUDGET = Object.freeze({
  target: APP_CONFIG.physics.targetFps,
  downgradeBelow: APP_CONFIG.performance.lowFpsThreshold,
  pausePhysicsBelow: APP_CONFIG.performance.pausePhysicsBelowFps,
  measureWindowMs: 1200,
});

export const BUNDLE_BUDGET_KB = Object.freeze({
  rapierGzipMax: 900,
  threeGzipMax: 200,
  r3fGzipMax: 200,
  appJsGzipMax: 80,
  cssGzipMax: 36,
});

export const RENDER_BUDGET = Object.freeze({
  maxDprHigh: 2,
  maxDprMedium: 1.5,
  maxDprLow: 1,
  /** Cap for mobile viewports even on high tier — saves GPU fill rate. */
  mobileMaxDpr: 1.25,
  /** Strict cap for low-tier mobile (≤4 cores or ≤4 GB RAM). */
  mobileLowTierMaxDpr: 1,
  shadowMapHigh: 2048,
  shadowMapMedium: 1024,
  maxSparkQueue: 40,
});

/** @typedef {{ mobile: boolean, lowTier: boolean, devicePixelRatio: number, hardwareConcurrency: number, deviceMemory: number }} DeviceProfile */

/** Detect mobile + low-tier hardware for DPR capping. */
export function detectDeviceProfile() {
  if (typeof window === 'undefined') {
    return {
      mobile: false,
      lowTier: false,
      devicePixelRatio: 1,
      hardwareConcurrency: 8,
      deviceMemory: 8,
    };
  }

  const mobile = window.matchMedia('(max-width: 768px), (hover: none) and (pointer: coarse)').matches;
  const hardwareConcurrency = navigator.hardwareConcurrency ?? 4;
  const deviceMemory = navigator.deviceMemory ?? 4;
  const devicePixelRatio = window.devicePixelRatio ?? 1;
  const lowTier = mobile && (hardwareConcurrency <= 4 || deviceMemory <= 4);

  return {
    mobile,
    lowTier,
    devicePixelRatio,
    hardwareConcurrency,
    deviceMemory,
  };
}

/** Resolve max DPR for a quality tier + device profile. */
export function resolveDprCap(tier, profile = detectDeviceProfile()) {
  const tierCap =
    tier === 'high'
      ? RENDER_BUDGET.maxDprHigh
      : tier === 'medium'
        ? RENDER_BUDGET.maxDprMedium
        : RENDER_BUDGET.maxDprLow;

  if (profile.lowTier) {
    return Math.min(tierCap, RENDER_BUDGET.mobileLowTierMaxDpr);
  }
  if (profile.mobile) {
    return Math.min(tierCap, RENDER_BUDGET.mobileMaxDpr);
  }
  return tierCap;
}

/** Apply render budget caps (DPR + shadow map) onto tier settings. */
export function applyRenderBudget(settings, tier, profile = detectDeviceProfile()) {
  const cap = resolveDprCap(tier, profile);
  const dprMax = Math.min(settings?.dprMax ?? cap, cap);
  let shadowMapSize = settings?.shadowMapSize;
  if (shadowMapSize > 0 && profile.lowTier) {
    shadowMapSize = Math.min(shadowMapSize, RENDER_BUDGET.shadowMapMedium);
  }
  return {
    ...settings,
    dprMax,
    ...(shadowMapSize !== undefined ? { shadowMapSize } : {}),
  };
}

export function fpsTier(fps) {
  if (fps >= FPS_BUDGET.target) return 'high';
  if (fps >= FPS_BUDGET.downgradeBelow) return 'medium';
  return 'low';
}

console.assert(fpsTier(60) === 'high', 'fps tier high');
console.assert(fpsTier(40) === 'low', 'fps tier low');
console.assert(resolveDprCap('high', { mobile: false, lowTier: false }) === 2, 'desktop high dpr');
console.assert(
  resolveDprCap('high', { mobile: true, lowTier: false }) === RENDER_BUDGET.mobileMaxDpr,
  'mobile high dpr cap'
);
console.assert(
  resolveDprCap('high', { mobile: true, lowTier: true }) === RENDER_BUDGET.mobileLowTierMaxDpr,
  'low-tier mobile dpr cap'
);
