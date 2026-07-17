/**
 * Adaptive framerate guard v2 — tier downgrade + god-mode feature throttle.
 */

import {
  RENDER_BUDGET,
  applyRenderBudget,
  detectDeviceProfile,
} from './performanceBudget.js';
import type {
  DeviceProfile,
  PerformanceGuardHandle,
  PerformanceGuardTickResult,
  QualitySettings,
  QualityTierName,
} from './types.js';

export const QUALITY_TIERS = Object.freeze({
  high: {
    postFx: true,
    bloomIntensity: 0.58,
    bloomThreshold: 0.78,
    chromaticAberration: true,
    shadows: true,
    shadowMapSize: RENDER_BUDGET.shadowMapHigh,
    starCount: 1200,
    contactShadows: true,
    envBlur: 0.85,
    dprMax: RENDER_BUDGET.maxDprHigh,
    ivorySSS: true,
    rimStreaks: true,
    quantumArc: true,
    godRays: 'volumetric',
    loungeDust: true,
    ballVapor: true,
    ghostChipsFull: true,
  },
  medium: {
    postFx: true,
    bloomIntensity: 0.32,
    bloomThreshold: 0.86,
    chromaticAberration: false,
    shadows: true,
    shadowMapSize: RENDER_BUDGET.shadowMapMedium,
    starCount: 600,
    contactShadows: true,
    envBlur: 0.6,
    dprMax: RENDER_BUDGET.maxDprMedium,
    ivorySSS: true,
    rimStreaks: true,
    quantumArc: false,
    godRays: 'gradient',
    loungeDust: false,
    ballVapor: false,
    ghostChipsFull: true,
  },
  low: {
    postFx: false,
    bloomIntensity: 0,
    bloomThreshold: 1,
    chromaticAberration: false,
    shadows: false,
    shadowMapSize: 0,
    starCount: 200,
    contactShadows: false,
    envBlur: 0.4,
    dprMax: RENDER_BUDGET.maxDprLow,
    ivorySSS: false,
    rimStreaks: false,
    quantumArc: false,
    godRays: 'off',
    loungeDust: false,
    ballVapor: false,
    ghostChipsFull: false,
  },
} satisfies Record<QualityTierName, QualitySettings>);

const HYSTERESIS = { downgrade: 55, upgrade: 58, godMode: 58 };
const SMOOTHING = 0.86;
const DOWNGRADE_STREAK = 4;
const UPGRADE_STREAK = 40;
const GOD_DOWNGRADE_STREAK = 2;
const GOD_UPGRADE_STREAK = 30;
const GOD_MODE_STEPS = 4;

/** Apply god-mode step-down on top of base tier settings. */
export function resolveGodModeSettings(
  base: QualitySettings | null | undefined,
  godStep: number
): QualitySettings | null | undefined {
  if (!base || godStep <= 0) return base;
  const s: QualitySettings = { ...base };
  if (godStep >= 1) s.godRays = s.godRays === 'volumetric' ? 'gradient' : s.godRays;
  if (godStep >= 2) s.loungeDust = false;
  if (godStep >= 3) s.ghostChipsFull = false;
  if (godStep >= 4) {
    s.quantumArc = false;
    s.ballVapor = false;
  }
  return s;
}

export function createPerformanceGuard(
  profile: DeviceProfile = detectDeviceProfile()
): PerformanceGuardHandle {
  let tier: QualityTierName = 'high';
  let godStep = 0;
  let avgFrameMs = 16.67;
  let lowStreak = 0;
  let highStreak = 0;
  let godLowStreak = 0;
  let godHighStreak = 0;

  function tierSettings(currentTier: QualityTierName, currentGodStep: number): QualitySettings {
    const base = QUALITY_TIERS[currentTier];
    const budgeted = applyRenderBudget(base, currentTier, profile) as QualitySettings;
    return resolveGodModeSettings(budgeted, currentGodStep) ?? budgeted;
  }

  function tick(frameMs: number): PerformanceGuardTickResult {
    avgFrameMs = avgFrameMs * SMOOTHING + frameMs * (1 - SMOOTHING);
    const fps = 1000 / Math.max(avgFrameMs, 1);

    if (fps < HYSTERESIS.downgrade) {
      lowStreak += 1;
      highStreak = 0;
    } else if (fps > HYSTERESIS.upgrade) {
      highStreak += 1;
      lowStreak = 0;
    } else {
      lowStreak = Math.max(0, lowStreak - 1);
      highStreak = Math.max(0, highStreak - 1);
    }

    if (fps < HYSTERESIS.godMode) {
      godLowStreak += 1;
      godHighStreak = 0;
    } else if (fps > HYSTERESIS.upgrade) {
      godHighStreak += 1;
      godLowStreak = 0;
    } else {
      godLowStreak = Math.max(0, godLowStreak - 1);
      godHighStreak = Math.max(0, godHighStreak - 1);
    }

    if (godLowStreak >= GOD_DOWNGRADE_STREAK && godStep < GOD_MODE_STEPS) {
      godStep += 1;
      godLowStreak = 0;
    }
    if (godHighStreak >= GOD_UPGRADE_STREAK && godStep > 0) {
      godStep -= 1;
      godHighStreak = 0;
    }

    if (lowStreak >= DOWNGRADE_STREAK) {
      if (tier === 'high') tier = 'medium';
      else if (tier === 'medium') tier = 'low';
      lowStreak = 0;
      godStep = GOD_MODE_STEPS;
    }
    if (highStreak >= UPGRADE_STREAK) {
      if (tier === 'low') tier = 'medium';
      else if (tier === 'medium') tier = 'high';
      highStreak = 0;
    }

    const settings = tierSettings(tier, godStep);

    return { tier, fps, avgFrameMs, settings, godStep };
  }

  function getSettings(): QualitySettings {
    return tierSettings(tier, godStep);
  }

  return {
    tick,
    getSettings,
    get deviceProfile() {
      return profile;
    },
    get tier() {
      return tier;
    },
    get godStep() {
      return godStep;
    },
    get fps() {
      return 1000 / avgFrameMs;
    },
  };
}

console.assert(QUALITY_TIERS.high.quantumArc === true, 'high tier quantum arc');
