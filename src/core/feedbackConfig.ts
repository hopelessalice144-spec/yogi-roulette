/**
 * Immersive feedback tunables — audio synthesis + haptic patterns.
 */

import type { FeedbackPrefs } from './types.js';

export const FEEDBACK_CONFIG = Object.freeze({
  storageKey: 'turboRoulette.feedback',

  audio: Object.freeze({
    masterGain: 0.52,
    rollBaseHz: 60,
    maxClackVoices: 3,
    chipPlaceHz: 880,
    betLockHz: [440, 330] as const,
    spinCueMs: 280,
  }),

  haptics: Object.freeze({
    collisionMinGapMs: 48,
    collisionSoftThreshold: 0.32,
    chipHoverMs: 10,
    betMs: 15,
    lockPattern: [18, 40, 12] as const,
    settlePattern: [40, 30, 15] as const,
    payoutPattern: [24, 55, 32, 48, 28] as const,
  }),
});

export function loadFeedbackPrefs(): FeedbackPrefs {
  const fallback: FeedbackPrefs = { audioMuted: false, hapticsMuted: false };
  try {
    const raw = localStorage.getItem(FEEDBACK_CONFIG.storageKey);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<FeedbackPrefs>;
    return {
      audioMuted: parsed.audioMuted === true,
      hapticsMuted: parsed.hapticsMuted === true,
    };
  } catch {
    return fallback;
  }
}

export function saveFeedbackPrefs({ audioMuted, hapticsMuted }: FeedbackPrefs): void {
  try {
    localStorage.setItem(
      FEEDBACK_CONFIG.storageKey,
      JSON.stringify({
        audioMuted: audioMuted === true,
        hapticsMuted: hapticsMuted === true,
      })
    );
  } catch {
    /* private mode */
  }
}

export function prefersReducedFeedback(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

console.assert(FEEDBACK_CONFIG.haptics.settlePattern.length === 3, 'settle haptic pattern');
