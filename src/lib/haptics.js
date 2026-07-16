/**
 * Native vibration patterns — tiered collision taps, pocket settle double-pulse.
 * Rate-limited for mobile battery; respects global enable + reduced-motion.
 */

import { FEEDBACK_CONFIG, prefersReducedFeedback } from '../core/feedbackConfig.js';

export const MINOR_BOUNCE_MS = 12;
export const SETTLE_HAPTIC_PATTERN = FEEDBACK_CONFIG.haptics.settlePattern;

let hapticsEnabled = true;
let lastCollisionAt = 0;

export function canVibrate() {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

export function setHapticsEnabled(enabled) {
  hapticsEnabled = enabled === true;
  if (!hapticsEnabled && canVibrate()) {
    try {
      navigator.vibrate(0);
    } catch {
      /* noop */
    }
  }
}

function shouldVibrate() {
  return hapticsEnabled && canVibrate() && !prefersReducedFeedback();
}

/**
 * Pin/divider collision haptics — 12ms tap on minor bounces, scaled pulse on hard hits.
 */
export function vibrateCollision(intensity = 0.5) {
  if (!shouldVibrate()) return;
  const now = Date.now();
  const gap = FEEDBACK_CONFIG.haptics.collisionMinGapMs;
  if (now - lastCollisionAt < gap && intensity < 0.55) return;
  lastCollisionAt = now;

  if (intensity < FEEDBACK_CONFIG.haptics.collisionSoftThreshold) {
    navigator.vibrate(MINOR_BOUNCE_MS);
    return;
  }
  const ms = Math.round(Math.min(42, 10 + intensity * 26));
  navigator.vibrate(ms);
}

/** Light tap when hovering a chip in the rack. */
export function vibrateChipHover() {
  if (!shouldVibrate()) return;
  navigator.vibrate(FEEDBACK_CONFIG.haptics.chipHoverMs);
}

/** Tactile confirm when placing a bet. */
export function vibrateBet() {
  if (!shouldVibrate()) return;
  navigator.vibrate(FEEDBACK_CONFIG.haptics.betMs);
}

/** Short double-tap when betting locks (no more bets). */
export function vibrateLock() {
  if (!shouldVibrate()) return;
  navigator.vibrate(FEEDBACK_CONFIG.haptics.lockPattern);
}

/** Double-pulse pocket settle thud (T-0). */
export function vibrateSettle() {
  if (!shouldVibrate()) return;
  navigator.vibrate(SETTLE_HAPTIC_PATTERN);
}

/** Dramatic multi-pulse on winning payout. */
export function vibratePayout() {
  if (!shouldVibrate()) return;
  navigator.vibrate(FEEDBACK_CONFIG.haptics.payoutPattern);
}
