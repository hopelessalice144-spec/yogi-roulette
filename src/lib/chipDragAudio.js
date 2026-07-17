/**
 * Chip drag/land timbre profiles — lounge warmth vs retro neon snap.
 */

import { UI_THEME_LIGHT, UI_THEME_NEON } from './uiTheme.js';

export const CHIP_DRAG_AUDIO = Object.freeze({
  lounge: Object.freeze({
    id: 'lounge',
    landHz: 1180,
    landLowHz: 720,
    whooshBp: 380,
    whooshQ: 1.1,
    whooshPeak: 0.032,
    landPeak: 0.085,
  }),
  neon: Object.freeze({
    id: 'neon',
    landHz: 1480,
    landLowHz: 920,
    whooshBp: 720,
    whooshQ: 1.65,
    whooshPeak: 0.046,
    landPeak: 0.095,
  }),
  light: Object.freeze({
    id: 'light',
    landHz: 1320,
    landLowHz: 840,
    whooshBp: 520,
    whooshQ: 0.95,
    whooshPeak: 0.028,
    landPeak: 0.078,
  }),
});

export function chipTimbreForTheme(uiTheme) {
  if (uiTheme === UI_THEME_NEON) return CHIP_DRAG_AUDIO.neon;
  if (uiTheme === UI_THEME_LIGHT) return CHIP_DRAG_AUDIO.light;
  return CHIP_DRAG_AUDIO.lounge;
}

/** Scale landing pitch by chip denomination — heavier chips thud lower. */
export function chipLandPitch(chipValue, profile) {
  const scale = 1 - Math.min(0.2, Math.log10(Math.max(1, chipValue)) * 0.065);
  return {
    high: profile.landHz * scale,
    low: profile.landLowHz * scale,
  };
}

/** Map pointer speed (px/ms) to whoosh intensity. */
export function chipDragWhooshIntensity(speedPxPerMs) {
  return Math.min(1.35, Math.max(0.15, speedPxPerMs * 0.85));
}
