import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BALL_DROP_AT } from '@core/timer.js';

const haptics = vi.hoisted(() => ({
  setHapticsEnabled: vi.fn(),
  vibrateBet: vi.fn(),
  vibrateChipHover: vi.fn(),
  vibrateCollision: vi.fn(),
  vibrateLock: vi.fn(),
  vibratePayout: vi.fn(),
  vibrateSettle: vi.fn(),
}));

const saveFeedbackPrefs = vi.hoisted(() => vi.fn());
const prefersReducedFeedback = vi.hoisted(() => vi.fn(() => false));

vi.mock('./haptics.js', () => haptics);
vi.mock('../core/feedbackConfig.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../core/feedbackConfig.js')>();
  return {
    ...actual,
    saveFeedbackPrefs,
    prefersReducedFeedback,
  };
});

import { createFeedbackBridge } from './feedbackBridge.js';

type BridgeAudio = NonNullable<Parameters<typeof createFeedbackBridge>[0]['audio']>;

function mockAudio(): BridgeAudio {
  return {
    setMuted: vi.fn(),
    ensureContextActive: vi.fn().mockResolvedValue(true),
    playBetLock: vi.fn(),
    playSpinCue: vi.fn(),
    playChipPlace: vi.fn().mockResolvedValue(undefined),
    playClack: vi.fn().mockResolvedValue(undefined),
    playSettle: vi.fn().mockResolvedValue(undefined),
    playWinFanfare: vi.fn().mockResolvedValue(undefined),
    setRolling: vi.fn(),
    setRollingVelocity: vi.fn(),
    suspend: vi.fn(),
    resume: vi.fn().mockResolvedValue(undefined),
  } as unknown as BridgeAudio;
}

describe('feedbackBridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prefersReducedFeedback.mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('applies initial mute prefs to audio and haptics', () => {
    const audio = mockAudio();
    const bridge = createFeedbackBridge({
      audio,
      initialPrefs: { audioMuted: true, hapticsMuted: true },
    });
    expect(bridge.audioMuted).toBe(true);
    expect(bridge.hapticsMuted).toBe(true);
    expect(audio.setMuted).toHaveBeenCalledWith(true);
    expect(haptics.setHapticsEnabled).toHaveBeenCalledWith(false);
  });

  it('persists audio mute toggles', () => {
    const audio = mockAudio();
    const bridge = createFeedbackBridge({ audio });
    expect(bridge.toggleAudio()).toBe(true);
    expect(audio.setMuted).toHaveBeenLastCalledWith(true);
    expect(saveFeedbackPrefs).toHaveBeenCalledWith({ audioMuted: true, hapticsMuted: false });
    expect(bridge.setAudioMuted(false)).toBe(false);
    expect(saveFeedbackPrefs).toHaveBeenLastCalledWith({ audioMuted: false, hapticsMuted: false });
  });

  it('syncs haptics when mute flag changes', () => {
    const bridge = createFeedbackBridge({ audio: mockAudio() });
    bridge.setHapticsMuted(true);
    expect(haptics.setHapticsEnabled).toHaveBeenLastCalledWith(false);
    bridge.setHapticsMuted(false);
    expect(haptics.setHapticsEnabled).toHaveBeenLastCalledWith(true);
    expect(saveFeedbackPrefs).toHaveBeenLastCalledWith({ audioMuted: false, hapticsMuted: false });
  });

  describe('onPhaseChange', () => {
    it('plays lock audio and haptics when betting closes', () => {
      const audio = mockAudio();
      const bridge = createFeedbackBridge({ audio });
      bridge.onPhaseChange('betting', 'locked');
      expect(audio.playBetLock).toHaveBeenCalledTimes(1);
      expect(haptics.vibrateLock).toHaveBeenCalledTimes(1);
      expect(audio.playSpinCue).not.toHaveBeenCalled();
    });

    it('plays spin cue when entering spinning at or after ball drop', () => {
      const audio = mockAudio();
      const bridge = createFeedbackBridge({ audio });
      bridge.onPhaseChange('locked', 'spinning', BALL_DROP_AT);
      expect(audio.playSpinCue).toHaveBeenCalledTimes(1);
      bridge.onPhaseChange('spinning', 'spinning', BALL_DROP_AT + 1);
      expect(audio.playSpinCue).toHaveBeenCalledTimes(1);
    });

    it('ignores duplicate phase notifications', () => {
      const audio = mockAudio();
      const bridge = createFeedbackBridge({ audio });
      bridge.onPhaseChange('betting', 'betting');
      expect(audio.playBetLock).not.toHaveBeenCalled();
      expect(haptics.vibrateLock).not.toHaveBeenCalled();
    });
  });

  describe('gameplay feedback', () => {
    it('routes chip, collision, and settle events to audio + haptics', async () => {
      const audio = mockAudio();
      const bridge = createFeedbackBridge({ audio });
      bridge.chipHover();
      await bridge.chipPlace();
      await bridge.collision(0.6);
      await bridge.settle();
      expect(haptics.vibrateChipHover).toHaveBeenCalledTimes(1);
      expect(audio.playChipPlace).toHaveBeenCalledTimes(1);
      expect(haptics.vibrateBet).toHaveBeenCalledTimes(1);
      expect(audio.playClack).toHaveBeenCalledWith(0.6);
      expect(haptics.vibrateCollision).toHaveBeenCalledWith(0.6);
      expect(audio.playSettle).toHaveBeenCalledTimes(1);
      expect(audio.setRolling).toHaveBeenCalledWith(0);
      expect(haptics.vibrateSettle).toHaveBeenCalledTimes(1);
    });

    it('skips win fanfare under reduced feedback but still haptics payout', async () => {
      prefersReducedFeedback.mockReturnValue(true);
      const audio = mockAudio();
      const bridge = createFeedbackBridge({ audio });
      await bridge.win();
      expect(audio.playWinFanfare).not.toHaveBeenCalled();
      expect(haptics.vibratePayout).toHaveBeenCalledTimes(1);
    });
  });

  it('delegates transport helpers to the audio engine', async () => {
    const audio = mockAudio();
    const bridge = createFeedbackBridge({ audio });
    await expect(bridge.ensureActive()).resolves.toBe(true);
    bridge.setRolling(0.8);
    bridge.setRollingVelocity(1.2);
    bridge.suspend();
    await bridge.resume();
    expect(audio.setRolling).toHaveBeenCalledWith(0.8);
    expect(audio.setRollingVelocity).toHaveBeenCalledWith(1.2);
    expect(audio.suspend).toHaveBeenCalledTimes(1);
    expect(audio.resume).toHaveBeenCalledTimes(1);
  });

  it('handles null audio gracefully', async () => {
    const bridge = createFeedbackBridge({ audio: null });
    expect(() => bridge.onPhaseChange('betting', 'locked')).not.toThrow();
    await expect(bridge.chipPlace()).resolves.toBeUndefined();
    await expect(bridge.ensureActive()).resolves.toBe(false);
    bridge.chipHover();
    expect(haptics.vibrateChipHover).toHaveBeenCalledTimes(1);
  });
});
