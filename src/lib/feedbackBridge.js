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
import { chipTimbreForTheme } from './chipDragAudio.js';

/**
 * @param {{ audio: import('./audioSynth.js').RouletteAudioEngine | null, initialPrefs?: { audioMuted?: boolean, hapticsMuted?: boolean } }} opts
 */
export function createFeedbackBridge({ audio, initialPrefs = {} }) {
  let audioMuted = initialPrefs.audioMuted === true;
  let hapticsMuted = initialPrefs.hapticsMuted === true;
  let lastPhase = null;
  let dragTimbre = 'lounge';
  let dragChipValue = 25;

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

    setChipDragTheme(uiTheme) {
      dragTimbre = chipTimbreForTheme(uiTheme).id;
    },

    async chipDragStart(chipValue, uiTheme) {
      dragChipValue = chipValue ?? 25;
      dragTimbre = chipTimbreForTheme(uiTheme).id;
      await audio?.ensureContextActive?.();
    },

    chipDragMove(speedPxPerMs, uiTheme) {
      if (audioMuted) return;
      const theme = uiTheme ? chipTimbreForTheme(uiTheme).id : dragTimbre;
      void audio?.playChipDragWhoosh?.(speedPxPerMs, theme);
    },

    async chipPlace(opts) {
      const chipValue = typeof opts === 'object' && opts ? opts.chipValue : undefined;
      const uiTheme = typeof opts === 'object' && opts ? opts.uiTheme : undefined;
      if (audio?.playChipLand) {
        await audio.playChipLand(chipValue ?? dragChipValue ?? 25, uiTheme ?? dragTimbre);
      } else {
        await audio?.playChipPlace?.(chipValue, uiTheme);
      }
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
