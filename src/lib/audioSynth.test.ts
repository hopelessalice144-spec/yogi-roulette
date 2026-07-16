import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FEEDBACK_CONFIG } from '../core/feedbackConfig.js';
import {
  RouletteAudioEngine,
  createAudioEngine,
  impactToClackIntensity,
} from './audioSynth.js';

type AudioParamMock = {
  value: number;
  setValueAtTime: ReturnType<typeof vi.fn>;
  setTargetAtTime: ReturnType<typeof vi.fn>;
  exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
  cancelScheduledValues: ReturnType<typeof vi.fn>;
};

function makeAudioParam(value = 0): AudioParamMock {
  return {
    value,
    setValueAtTime: vi.fn(),
    setTargetAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
  };
}

function makeMockAudioContext(state: 'running' | 'suspended' = 'running') {
  const destination = { connect: vi.fn(), disconnect: vi.fn() };

  const ctx = {
    state,
    currentTime: 0,
    sampleRate: 48_000,
    destination,
    resume: vi.fn(async () => {
      ctx.state = 'running';
    }),
    suspend: vi.fn(async () => {
      ctx.state = 'suspended';
    }),
    close: vi.fn(),
    createGain: vi.fn(() => ({
      gain: makeAudioParam(1),
      connect: vi.fn(),
      disconnect: vi.fn(),
    })),
    createOscillator: vi.fn(() => ({
      type: 'sine',
      frequency: makeAudioParam(440),
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    })),
    createBiquadFilter: vi.fn(() => ({
      type: 'lowpass',
      frequency: makeAudioParam(1000),
      Q: makeAudioParam(1),
      connect: vi.fn(),
      disconnect: vi.fn(),
    })),
    createDynamicsCompressor: vi.fn(() => ({
      threshold: makeAudioParam(-14),
      knee: makeAudioParam(6),
      ratio: makeAudioParam(10),
      attack: makeAudioParam(0.002),
      release: makeAudioParam(0.12),
      connect: vi.fn(),
      disconnect: vi.fn(),
    })),
    createBuffer: vi.fn((channels: number, length: number, sampleRate: number) => ({
      numberOfChannels: channels,
      length,
      sampleRate,
      getChannelData: () => new Float32Array(length),
    })),
    createBufferSource: vi.fn(() => ({
      buffer: null as unknown,
      loop: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    })),
  };

  return ctx;
}

function installAudioContext(state: 'running' | 'suspended' = 'running') {
  const ctx = makeMockAudioContext(state);
  const AC = vi.fn(() => ctx);
  vi.stubGlobal('window', {
    AudioContext: AC,
    webkitAudioContext: undefined,
    setTimeout: (...args: Parameters<typeof setTimeout>) => setTimeout(...args),
  });
  return { ctx, AC };
}

function readyEngine(state: 'running' | 'suspended' = 'running') {
  const { ctx } = installAudioContext(state);
  const engine = new RouletteAudioEngine();
  engine.init();
  return { engine, ctx };
}

describe('audioSynth', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe('impactToClackIntensity', () => {
    it('maps impact speed into [0.08, 1.4]', () => {
      expect(impactToClackIntensity(0)).toBe(0.08);
      expect(impactToClackIntensity(1)).toBeCloseTo(0.85, 5);
      expect(impactToClackIntensity(10)).toBe(1.4);
    });
  });

  describe('createAudioEngine', () => {
    it('returns a RouletteAudioEngine instance', () => {
      const engine = createAudioEngine();
      expect(engine).toBeInstanceOf(RouletteAudioEngine);
    });
  });

  describe('init', () => {
    it('returns null when Web Audio is unavailable', () => {
      vi.stubGlobal('window', {
        AudioContext: undefined,
        webkitAudioContext: undefined,
      });
      const engine = new RouletteAudioEngine();
      expect(engine.init()).toBeNull();
      expect(engine.isActive).toBe(false);
    });

    it('builds the graph once and reuses the context', () => {
      const { ctx, AC } = installAudioContext();
      const engine = new RouletteAudioEngine();

      expect(engine.init()).toBe(ctx);
      expect(engine.init()).toBe(ctx);
      expect(AC).toHaveBeenCalledTimes(1);
      expect(ctx.createDynamicsCompressor).toHaveBeenCalled();
      expect(ctx.createGain).toHaveBeenCalled();
    });
  });

  describe('ensureContextActive', () => {
    it('resumes a suspended context', async () => {
      const { engine, ctx } = readyEngine('suspended');
      await expect(engine.ensureContextActive()).resolves.toBe(true);
      expect(ctx.resume).toHaveBeenCalled();
      expect(engine.isActive).toBe(true);
    });

    it('returns false when resume fails', async () => {
      const { engine, ctx } = readyEngine('suspended');
      ctx.resume.mockRejectedValueOnce(new Error('blocked'));
      await expect(engine.ensureContextActive()).resolves.toBe(false);
    });
  });

  describe('setMuted', () => {
    it('targets master gain to zero when muted', () => {
      const { engine } = readyEngine();
      const master = engine.master!;
      engine.setMuted(true);
      expect(engine.muted).toBe(true);
      expect(master.gain.setTargetAtTime).toHaveBeenCalledWith(0, 0, 0.05);
      engine.setMuted(false);
      expect(master.gain.setTargetAtTime).toHaveBeenLastCalledWith(
        FEEDBACK_CONFIG.audio.masterGain,
        0,
        0.05,
      );
    });
  });

  describe('setRollingVelocity', () => {
    it('tracks tangential speed and drives rumble gain', () => {
      const { engine } = readyEngine();
      engine.setRollingVelocity({ x: 2, y: 0, z: 2 });
      expect(engine.rollingSpeed).toBeCloseTo(2.828, 2);
      expect(engine.rumbleGain!.gain.setTargetAtTime).toHaveBeenCalled();
      expect(engine.rumbleFilter!.frequency.setTargetAtTime).toHaveBeenCalled();
    });

    it('no-ops when muted or context is not running', () => {
      const { engine, ctx } = readyEngine();
      engine.setMuted(true);
      engine.setRollingVelocity({ x: 3, y: 0, z: 3 });
      expect(engine.rollingSpeed).toBe(0);

      engine.setMuted(false);
      ctx.state = 'suspended';
      engine.setRollingVelocity({ x: 3, y: 0, z: 3 });
      expect(engine.rollingSpeed).toBe(0);
    });
  });

  describe('playClack', () => {
    it('skips playback when muted', async () => {
      const { engine } = readyEngine();
      engine.setMuted(true);
      await engine.playClack(1);
      expect(engine['_clackVoices']).toHaveLength(0);
    });

    it('pools voices and decays the oldest at the cap', async () => {
      const { engine } = readyEngine();
      const cap = FEEDBACK_CONFIG.audio.maxClackVoices;

      for (let i = 0; i < cap + 1; i++) {
        await engine.playClack(0.5 + i * 0.1);
      }

      expect(engine['_clackVoices'].length).toBeLessThanOrEqual(cap);
      vi.advanceTimersByTime(100);
      expect(engine['_clackVoices'].length).toBeLessThanOrEqual(cap);
    });
  });

  describe('playSettle', () => {
    it('debounces overlapping settle cues', async () => {
      const { engine } = readyEngine();
      const first = engine.playSettle();
      const second = engine.playSettle();
      await Promise.all([first, second]);
      expect(engine['_settlePlaying']).toBe(true);
      vi.advanceTimersByTime(520);
      expect(engine['_settlePlaying']).toBe(false);
    });
  });

  describe('lifecycle', () => {
    it('suspend pauses the audio context', async () => {
      const { engine, ctx } = readyEngine();
      await engine.suspend();
      expect(ctx.suspend).toHaveBeenCalled();
    });

    it('setRolling zeros rolling speed while the context is running', () => {
      const { engine } = readyEngine();
      engine.setRolling(2);
      expect(engine.rollingSpeed).toBeGreaterThan(0);
      engine.setRolling(0);
      expect(engine.rollingSpeed).toBe(0);
    });

    it('destroy tears down sources and clears the context', () => {
      const { engine, ctx } = readyEngine();
      const rumble = engine.rumbleSource!;
      const friction = engine.frictionSource!;
      engine.destroy();
      expect(rumble.stop).toHaveBeenCalled();
      expect(friction.stop).toHaveBeenCalled();
      expect(ctx.close).toHaveBeenCalled();
      expect(engine.ctx).toBeNull();
      expect(engine.master).toBeNull();
    });
  });
});
