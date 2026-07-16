/**
 * Unified audio + haptics facade — phase cues, mobile rate limits, preference sync.
 */

import { BALL_DROP_AT } from '@core/timer.js';
import {
  FEEDBACK_CONFIG,
  prefersReducedFeedback,
  saveFeedbackPrefs,
} from '../core/feedbackConfig.js';
import {
  setHapticsEnabled,
  vibrateBet,
  vibrateChipHover,
  vibrateCollision,
  vibrateLock,
  vibratePayout,
  vibrateSettle,
} from './haptics.js';

/**
 * @param {{ audio: import('./audioSynth.js').RouletteAudioEngine | null, initialPrefs?: { audioMuted?: boolean, hapticsMuted?: boolean } }} opts
 */
export function createFeedbackBridge({ audio, initialPrefs = {} }) {
  let audioMuted = initialPrefs.audioMuted === true;
  let hapticsMuted = initialPrefs.hapticsMuted === true;
  let lastPhase = null;

  const syncHaptics = () => {
    setHapticsEnabled(!hapticsMuted && !prefersReducedFeedback());
  };
  syncHaptics();

  const applyAudioMute = () => {
    audio?.setMuted(audioMuted);
  };
  applyAudioMute();

  const persist = () => {
    saveFeedbackPrefs({ audioMuted, hapticsMuted });
  };

  return {
    get audioMuted() {
      return audioMuted;
    },
    get hapticsMuted() {
      return hapticsMuted;
    },

    setAudioMuted(muted) {
      audioMuted = muted === true;
      applyAudioMute();
      persist();
      return audioMuted;
    },

    toggleAudio() {
      return this.setAudioMuted(!audioMuted);
    },

    setHapticsMuted(muted) {
      hapticsMuted = muted === true;
      syncHaptics();
      persist();
      return hapticsMuted;
    },

    async ensureActive() {
      return audio?.ensureContextActive() ?? false;
    },

    onPhaseChange(prevPhase, nextPhase, cycleSecond = 0) {
      if (!audio) return;
      if (nextPhase === lastPhase && prevPhase === nextPhase) return;
      lastPhase = nextPhase;

      if (nextPhase === 'locked' && prevPhase === 'betting') {
        audio.playBetLock?.();
        vibrateLock();
      }
      if (nextPhase === 'spinning' && prevPhase !== 'spinning' && cycleSecond >= BALL_DROP_AT) {
        audio.playSpinCue?.();
      }
    },

    chipHover() {
      vibrateChipHover();
    },

    async chipPlace() {
      await audio?.playChipPlace?.();
      vibrateBet();
    },

    async collision(intensity) {
      await audio?.playClack?.(intensity);
      vibrateCollision(intensity);
    },

    async settle() {
      await audio?.playSettle?.();
      audio?.setRolling?.(0);
      vibrateSettle();
    },

    async win() {
      if (!prefersReducedFeedback()) {
        await audio?.playWinFanfare?.();
      }
      vibratePayout();
    },

    setRolling(speed) {
      audio?.setRolling?.(speed);
    },

    setRollingVelocity(vel) {
      audio?.setRollingVelocity?.(vel);
    },

    suspend() {
      audio?.suspend?.();
    },

    resume() {
      return audio?.resume?.();
    },
  };
}

console.assert(typeof createFeedbackBridge === 'function', 'feedback bridge export');
