import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FEEDBACK_CONFIG,
  loadFeedbackPrefs,
  prefersReducedFeedback,
  saveFeedbackPrefs,
} from './feedbackConfig.js';

function mockLocalStorage(): Map<string, string> {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  });
  return store;
}

function mockMatchMedia(matches: boolean): void {
  vi.stubGlobal('window', {
    matchMedia: vi.fn().mockReturnValue({ matches }),
  });
}

describe('feedbackConfig', () => {
  let store: Map<string, string>;

  beforeEach(() => {
    store = mockLocalStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('exports audio and haptic tunables', () => {
    expect(FEEDBACK_CONFIG.storageKey).toBe('turboRoulette.feedback');
    expect(FEEDBACK_CONFIG.audio.masterGain).toBeGreaterThan(0);
    expect(FEEDBACK_CONFIG.haptics.collisionMinGapMs).toBe(48);
    expect(FEEDBACK_CONFIG.haptics.settlePattern).toHaveLength(3);
  });

  describe('loadFeedbackPrefs', () => {
    it('returns defaults when storage is empty', () => {
      expect(loadFeedbackPrefs()).toEqual({ audioMuted: false, hapticsMuted: false });
    });

    it('loads persisted mute flags', () => {
      store.set(
        FEEDBACK_CONFIG.storageKey,
        JSON.stringify({ audioMuted: true, hapticsMuted: false })
      );
      expect(loadFeedbackPrefs()).toEqual({ audioMuted: true, hapticsMuted: false });
    });

    it('coerces partial payloads to booleans', () => {
      store.set(FEEDBACK_CONFIG.storageKey, JSON.stringify({ audioMuted: 'yes' }));
      expect(loadFeedbackPrefs()).toEqual({ audioMuted: false, hapticsMuted: false });
    });

    it('falls back on corrupt JSON', () => {
      store.set(FEEDBACK_CONFIG.storageKey, '{bad');
      expect(loadFeedbackPrefs()).toEqual({ audioMuted: false, hapticsMuted: false });
    });
  });

  describe('saveFeedbackPrefs', () => {
    it('persists mute flags to localStorage', () => {
      saveFeedbackPrefs({ audioMuted: true, hapticsMuted: true });
      const raw = store.get(FEEDBACK_CONFIG.storageKey);
      expect(raw).toBe(JSON.stringify({ audioMuted: true, hapticsMuted: true }));
      expect(loadFeedbackPrefs()).toEqual({ audioMuted: true, hapticsMuted: true });
    });

    it('round-trips through load', () => {
      saveFeedbackPrefs({ audioMuted: false, hapticsMuted: true });
      expect(loadFeedbackPrefs().hapticsMuted).toBe(true);
    });
  });

  describe('prefersReducedFeedback', () => {
    it('returns false when matchMedia is unavailable', () => {
      vi.stubGlobal('window', undefined);
      expect(prefersReducedFeedback()).toBe(false);
    });

    it('reflects prefers-reduced-motion media query', () => {
      mockMatchMedia(true);
      expect(prefersReducedFeedback()).toBe(true);
      mockMatchMedia(false);
      expect(prefersReducedFeedback()).toBe(false);
    });
  });
});
