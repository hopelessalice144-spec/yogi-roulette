import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FEEDBACK_CONFIG } from '../core/feedbackConfig.js';
import {
  canVibrate,
  MINOR_BOUNCE_MS,
  setHapticsEnabled,
  SETTLE_HAPTIC_PATTERN,
  vibrateBet,
  vibrateChipHover,
  vibrateCollision,
  vibrateLock,
  vibratePayout,
  vibrateSettle,
} from './haptics.js';

function setupHapticsEnv(reducedMotion = false) {
  const vibrate = vi.fn();
  vi.stubGlobal('navigator', { vibrate });
  vi.stubGlobal('window', {
    matchMedia: vi.fn().mockReturnValue({ matches: reducedMotion }),
  });
  return vibrate;
}

describe('haptics', () => {
  beforeEach(() => {
    setupHapticsEnv(false);
    setHapticsEnabled(true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('exports minor bounce and settle pattern constants', () => {
    expect(MINOR_BOUNCE_MS).toBe(12);
    expect(SETTLE_HAPTIC_PATTERN).toEqual(FEEDBACK_CONFIG.haptics.settlePattern);
  });

  describe('canVibrate / setHapticsEnabled', () => {
    it('detects navigator.vibrate support', () => {
      expect(canVibrate()).toBe(true);
      vi.stubGlobal('navigator', {});
      expect(canVibrate()).toBe(false);
    });

    it('clears pending vibration when disabled', () => {
      const vibrate = setupHapticsEnv(false);
      setHapticsEnabled(false);
      expect(vibrate).toHaveBeenCalledWith(0);
    });
  });

  describe('vibrateCollision', () => {
    it('uses minor bounce duration for soft collisions', () => {
      const vibrate = setupHapticsEnv(false);
      vi.spyOn(Date, 'now').mockReturnValue(10_000);
      vibrateCollision(0.2);
      expect(vibrate).toHaveBeenCalledWith(MINOR_BOUNCE_MS);
    });

    it('scales pulse duration for hard collisions', () => {
      const vibrate = setupHapticsEnv(false);
      vi.spyOn(Date, 'now').mockReturnValue(20_000);
      vibrateCollision(0.8);
      expect(vibrate).toHaveBeenCalledWith(31);
    });

    it('rate-limits soft collisions inside min gap', () => {
      const vibrate = setupHapticsEnv(false);
      const now = vi.spyOn(Date, 'now');
      now.mockReturnValue(30_000);
      vibrateCollision(0.3);
      now.mockReturnValue(30_020);
      vibrateCollision(0.3);
      expect(vibrate).toHaveBeenCalledTimes(1);
      now.mockReturnValue(30_060);
      vibrateCollision(0.3);
      expect(vibrate).toHaveBeenCalledTimes(2);
    });

    it('allows hard collisions through the rate limiter', () => {
      const vibrate = setupHapticsEnv(false);
      const now = vi.spyOn(Date, 'now');
      now.mockReturnValue(40_000);
      vibrateCollision(0.3);
      now.mockReturnValue(40_010);
      vibrateCollision(0.7);
      expect(vibrate).toHaveBeenCalledTimes(2);
    });
  });

  describe('phase vibration helpers', () => {
    it('fires configured patterns for chip, bet, lock, settle, and payout', () => {
      const vibrate = setupHapticsEnv(false);
      vibrateChipHover();
      vibrateBet();
      vibrateLock();
      vibrateSettle();
      vibratePayout();
      expect(vibrate).toHaveBeenNthCalledWith(1, FEEDBACK_CONFIG.haptics.chipHoverMs);
      expect(vibrate).toHaveBeenNthCalledWith(2, FEEDBACK_CONFIG.haptics.betMs);
      expect(vibrate).toHaveBeenNthCalledWith(3, FEEDBACK_CONFIG.haptics.lockPattern);
      expect(vibrate).toHaveBeenNthCalledWith(4, SETTLE_HAPTIC_PATTERN);
      expect(vibrate).toHaveBeenNthCalledWith(5, FEEDBACK_CONFIG.haptics.payoutPattern);
    });
  });

  describe('preference gates', () => {
    it('skips vibration when haptics are disabled', () => {
      const vibrate = setupHapticsEnv(false);
      setHapticsEnabled(false);
      vibrateBet();
      expect(vibrate).toHaveBeenCalledTimes(1);
      expect(vibrate).toHaveBeenCalledWith(0);
    });

    it('skips vibration when reduced motion is preferred', () => {
      const vibrate = setupHapticsEnv(true);
      vibrateSettle();
      expect(vibrate).not.toHaveBeenCalled();
    });
  });
});
