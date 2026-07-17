/**
 * Physical-modeling Web Audio engine — wheel rumble, ball-on-track ring, deflector clacks,
 * pocket bounce settle, and casino chip cues. Lazy init after user gesture.
 */

import { FEEDBACK_CONFIG } from '../core/feedbackConfig.js';
import {
  chipDragWhooshIntensity,
  chipLandPitch,
  chipTimbreForTheme,
} from './chipDragAudio.js';

const MAX_CLACK_VOICES = FEEDBACK_CONFIG.audio.maxClackVoices;
const ROLL_BASE_HZ = FEEDBACK_CONFIG.audio.rollBaseHz;
const MASTER_GAIN = FEEDBACK_CONFIG.audio.masterGain;
const ROLL_LFO_HZ = 3.6;
const ORBIT_TICK_MIN = FEEDBACK_CONFIG.audio.orbitTickMinSpeed;
const ORBIT_TICK_BASE = FEEDBACK_CONFIG.audio.orbitTickBaseMs / 1000;
const TRACK_RING_HZ = FEEDBACK_CONFIG.audio.trackRingHz;

export class RouletteAudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.limiter = null;
    this.rumbleGain = null;
    this.rumbleFilter = null;
    this.rumbleSource = null;
    this.frictionGain = null;
    this.frictionFilter = null;
    this.frictionSource = null;
    this.trackRingGain = null;
    this.trackRingFilter = null;
    this.trackRingSource = null;
    this.wheelBodyGain = null;
    this.wheelBodyOsc = null;
    this.rollLfo = null;
    this.rollLfoGain = null;
    this.spinGain = null;
    this.spinOsc = null;
    this.muted = false;
    this._rollingSpeed = 0;
    this._lastOrbitTickAt = 0;
    /** @type {{ gain: GainNode, startedAt: number, cleanup: () => void }[]} */
    this._clackVoices = [];
    this._noiseBuffer = null;
    this._settlePlaying = false;
    this._lastChipWhooshAt = 0;
  }

  /** Build graph only after explicit user gesture unlock. */
  init() {
    if (this.ctx) return this.ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;

    const ctx = new AC();
    this.ctx = ctx;

    this.limiter = ctx.createDynamicsCompressor();
    this.limiter.threshold.value = -12;
    this.limiter.knee.value = 8;
    this.limiter.ratio.value = 8;
    this.limiter.attack.value = 0.003;
    this.limiter.release.value = 0.1;

    this.master = ctx.createGain();
    this.master.gain.value = MASTER_GAIN;
    this.master.connect(this.limiter);
    this.limiter.connect(ctx.destination);

    const bufferSize = 2 * ctx.sampleRate;
    this._noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = this._noiseBuffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      last = last * 0.982 + white * 0.018;
      data[i] = last * 2.4;
    }

    // Wheel mass rumble — filtered brown noise
    this.rumbleGain = ctx.createGain();
    this.rumbleGain.gain.value = 0;
    this.rumbleFilter = ctx.createBiquadFilter();
    this.rumbleFilter.type = 'lowpass';
    this.rumbleFilter.frequency.value = ROLL_BASE_HZ + 55;
    this.rumbleFilter.Q.value = 0.85;
    this.rumbleGain.connect(this.rumbleFilter);
    this.rumbleFilter.connect(this.master);

    this.rumbleSource = ctx.createBufferSource();
    this.rumbleSource.buffer = this._noiseBuffer;
    this.rumbleSource.loop = true;
    this.rumbleSource.connect(this.rumbleGain);
    this.rumbleSource.start();

    // Mahogany track friction — mid bandpass
    this.frictionGain = ctx.createGain();
    this.frictionGain.gain.value = 0;
    this.frictionFilter = ctx.createBiquadFilter();
    this.frictionFilter.type = 'bandpass';
    this.frictionFilter.frequency.value = 110;
    this.frictionFilter.Q.value = 1.25;
    this.frictionGain.connect(this.frictionFilter);
    this.frictionFilter.connect(this.master);

    this.frictionSource = ctx.createBufferSource();
    this.frictionSource.buffer = this._noiseBuffer;
    this.frictionSource.loop = true;
    this.frictionSource.connect(this.frictionGain);
    this.frictionSource.start();

    // Ball-on-ivory-track ring — characteristic high chatter
    this.trackRingGain = ctx.createGain();
    this.trackRingGain.gain.value = 0;
    this.trackRingFilter = ctx.createBiquadFilter();
    this.trackRingFilter.type = 'bandpass';
    this.trackRingFilter.frequency.value = TRACK_RING_HZ;
    this.trackRingFilter.Q.value = 2.8;
    this.trackRingGain.connect(this.trackRingFilter);
    this.trackRingFilter.connect(this.master);

    this.trackRingSource = ctx.createBufferSource();
    this.trackRingSource.buffer = this._noiseBuffer;
    this.trackRingSource.loop = true;
    this.trackRingSource.connect(this.trackRingGain);
    this.trackRingSource.start();

    // Rotating wheel bearing tone
    this.wheelBodyGain = ctx.createGain();
    this.wheelBodyGain.gain.value = 0;
    this.wheelBodyOsc = ctx.createOscillator();
    this.wheelBodyOsc.type = 'sine';
    this.wheelBodyOsc.frequency.value = ROLL_BASE_HZ * 0.65;
    const wheelFilter = ctx.createBiquadFilter();
    wheelFilter.type = 'lowpass';
    wheelFilter.frequency.value = 140;
    wheelFilter.Q.value = 0.5;
    this.wheelBodyOsc.connect(wheelFilter);
    wheelFilter.connect(this.wheelBodyGain);
    this.wheelBodyGain.connect(this.master);
    this.wheelBodyOsc.start();

    // LFO breathes the hum like a live wooden wheel
    this.rollLfo = ctx.createOscillator();
    this.rollLfo.type = 'sine';
    this.rollLfo.frequency.value = ROLL_LFO_HZ;
    this.rollLfoGain = ctx.createGain();
    this.rollLfoGain.gain.value = 0;
    this.rollLfo.connect(this.rollLfoGain);
    this.rollLfoGain.connect(this.rumbleGain.gain);
    this.rollLfoGain.connect(this.frictionGain.gain);
    this.rollLfoGain.connect(this.trackRingGain.gain);
    this.rollLfo.start();

    // Ball orbital sub-harmonic
    this.spinGain = ctx.createGain();
    this.spinGain.gain.value = 0;
    this.spinOsc = ctx.createOscillator();
    this.spinOsc.type = 'sine';
    this.spinOsc.frequency.value = ROLL_BASE_HZ;
    const spinFilter = ctx.createBiquadFilter();
    spinFilter.type = 'lowpass';
    spinFilter.frequency.value = 200;
    spinFilter.Q.value = 0.65;
    this.spinOsc.connect(spinFilter);
    spinFilter.connect(this.spinGain);
    this.spinGain.connect(this.master);
    this.spinOsc.start();

    return ctx;
  }

  async ensureContextActive() {
    if (!this.ctx) this.init();
    if (!this.ctx) return false;
    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch {
        return false;
      }
    }
    return this.ctx.state === 'running';
  }

  /** @deprecated Use ensureContextActive */
  async unlock() {
    return this.ensureContextActive();
  }

  /** @deprecated Lazy — no-op until ensureContextActive */
  ensure() {
    return this.ctx;
  }

  get rollingSpeed() {
    return this._rollingSpeed;
  }

  get isActive() {
    return this.ctx?.state === 'running';
  }

  setMuted(m) {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : MASTER_GAIN, this.ctx.currentTime, 0.05);
    }
  }

  setRolling(speed) {
    this.setRollingVelocity({ x: speed * 0.7, y: 0, z: speed * 0.7 });
  }

  _maybePlayOrbitTick(tangential) {
    if (!this.ctx || this.muted || tangential < ORBIT_TICK_MIN) return;
    const now = this.ctx.currentTime;
    const interval = Math.max(0.035, ORBIT_TICK_BASE / tangential);
    if (now - this._lastOrbitTickAt < interval) return;
    this._lastOrbitTickAt = now;
    this.playOrbitTick(tangential);
  }

  /**
   * Dynamic rolling friction hum — pitch + gain track |v| in real time.
   */
  setRollingVelocity(vel) {
    if (!this.ctx || !this.rumbleGain || this.muted || this.ctx.state !== 'running') return;

    const vx = vel?.x ?? 0;
    const vy = vel?.y ?? 0;
    const vz = vel?.z ?? 0;
    const tangential = Math.hypot(vx, vz);
    const total = Math.hypot(vx, vy, vz);
    this._rollingSpeed = tangential;

    const t = this.ctx.currentTime;
    const vol = Math.min(0.32, tangential * 0.11 + total * 0.022);
    this.rumbleGain.gain.setTargetAtTime(vol, t, 0.08);
    this.rumbleFilter.frequency.setTargetAtTime(
      ROLL_BASE_HZ + tangential * 48 + Math.abs(vy) * 26,
      t,
      0.11
    );
    this.rumbleFilter.Q.setTargetAtTime(0.55 + tangential * 0.12, t, 0.13);

    if (this.frictionGain && this.frictionFilter) {
      const fVol = Math.min(0.18, tangential * 0.058 + total * 0.01);
      this.frictionGain.gain.setTargetAtTime(fVol, t, 0.09);
      this.frictionFilter.frequency.setTargetAtTime(
        88 + tangential * 22 + Math.abs(vy) * 10,
        t,
        0.12
      );
    }

    if (this.trackRingGain && this.trackRingFilter) {
      const ringVol = Math.min(0.22, tangential * 0.075 + total * 0.012);
      this.trackRingGain.gain.setTargetAtTime(ringVol, t, 0.07);
      this.trackRingFilter.frequency.setTargetAtTime(
        TRACK_RING_HZ + tangential * 120 + Math.abs(vy) * 40,
        t,
        0.09
      );
      this.trackRingFilter.Q.setTargetAtTime(2.2 + tangential * 0.35, t, 0.1);
    }

    if (this.wheelBodyGain && this.wheelBodyOsc) {
      const bodyVol = Math.min(0.12, 0.02 + tangential * 0.028);
      this.wheelBodyGain.gain.setTargetAtTime(bodyVol, t, 0.1);
      this.wheelBodyOsc.frequency.setTargetAtTime(
        Math.max(28, ROLL_BASE_HZ * 0.55 + tangential * 4.5),
        t,
        0.12
      );
    }

    if (this.rollLfo && this.rollLfoGain) {
      const lfoDepth = Math.min(0.055, tangential * 0.028);
      this.rollLfoGain.gain.setTargetAtTime(lfoDepth, t, 0.14);
      this.rollLfo.frequency.setTargetAtTime(ROLL_LFO_HZ + tangential * 2.2, t, 0.16);
    }

    if (this.spinGain && this.spinOsc) {
      const pitch = ROLL_BASE_HZ + tangential * 10 + vy * 5;
      this.spinGain.gain.setTargetAtTime(Math.min(0.11, tangential * 0.028), t, 0.1);
      this.spinOsc.frequency.setTargetAtTime(Math.max(36, Math.min(260, pitch)), t, 0.12);
    }

    this._maybePlayOrbitTick(tangential);
  }

  _decayOldestClack() {
    if (this._clackVoices.length === 0) return;
    const oldest = this._clackVoices.reduce((a, b) => (a.startedAt < b.startedAt ? a : b));
    const t = this.ctx.currentTime;
    oldest.gain.gain.cancelScheduledValues(t);
    oldest.gain.gain.setTargetAtTime(0.0001, t, 0.012);
    oldest.cleanup?.();
    this._clackVoices = this._clackVoices.filter((v) => v !== oldest);
  }

  _releaseClackVoice(voice) {
    this._clackVoices = this._clackVoices.filter((v) => v !== voice);
  }

  /** Disconnect ephemeral nodes after envelope completes. */
  _scheduleVoiceTeardown(nodes, delaySec = 0.5) {
    if (!this.ctx) return;
    window.setTimeout(() => {
      for (const node of nodes) {
        try {
          node?.disconnect?.();
        } catch {
          /* torn down */
        }
      }
      for (const node of nodes) {
        if (node?.stop) {
          try {
            node.stop();
          } catch {
            /* already stopped */
          }
        }
      }
    }, delaySec * 1000 + 20);
  }

  _playTransientNoise({ t, duration, peak, hpHz, bpHz, bpQ = 4 }) {
    const ctx = this.ctx;
    if (!ctx || !this.master) return [];

    const noise = ctx.createBufferSource();
    const len = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    noise.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = bpHz != null ? 'bandpass' : 'highpass';
    filter.frequency.value = bpHz ?? hpHz ?? 2000;
    if (bpHz != null) filter.Q.value = bpQ;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.001);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    noise.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    noise.start(t);
    noise.stop(t + duration + 0.01);

    return [noise, filter, g];
  }

  async suspend() {
    if (this.ctx?.state === 'running') {
      try {
        await this.ctx.suspend();
      } catch {
        /* ignore */
      }
    }
    this.setRolling(0);
  }

  async resume() {
    return this.ensureContextActive();
  }

  destroy() {
    for (const voice of [...this._clackVoices]) {
      voice.cleanup?.();
    }
    this._clackVoices = [];
    try {
      this.rumbleSource?.stop();
      this.frictionSource?.stop();
      this.trackRingSource?.stop();
      this.rollLfo?.stop();
      this.spinOsc?.stop();
      this.wheelBodyOsc?.stop();
    } catch {
      /* ignore */
    }
    try {
      this.rumbleSource?.disconnect();
      this.frictionSource?.disconnect();
      this.trackRingSource?.disconnect();
      this.rollLfo?.disconnect();
      this.spinOsc?.disconnect();
      this.wheelBodyOsc?.disconnect();
      this.master?.disconnect();
      this.limiter?.disconnect();
      this.ctx?.close();
    } catch {
      /* ignore */
    }
    this.ctx = null;
    this.master = null;
    this.limiter = null;
    this.rumbleGain = null;
    this.rumbleFilter = null;
    this.rumbleSource = null;
    this.frictionGain = null;
    this.frictionFilter = null;
    this.frictionSource = null;
    this.trackRingGain = null;
    this.trackRingFilter = null;
    this.trackRingSource = null;
    this.wheelBodyGain = null;
    this.wheelBodyOsc = null;
    this.rollLfo = null;
    this.rollLfoGain = null;
    this.spinGain = null;
    this.spinOsc = null;
    this._noiseBuffer = null;
  }

  /**
   * Light fret tick as the ball orbits the outer track — rhythmic roulette chatter.
   */
  playOrbitTick(speed = 0.5) {
    if (!this.ctx || this.muted || !this.master) return;

    const ctx = this.ctx;
    const t = ctx.currentTime;
    const intensity = Math.min(1.2, Math.max(0.2, speed * 0.35));
    const jitter = 0.92 + Math.random() * 0.16;
    const pingHz = (2800 + intensity * 1400) * jitter;

    const g = ctx.createGain();
    g.connect(this.master);
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(pingHz, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(900, pingHz * 0.55), t + 0.012);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.min(0.09, 0.025 + intensity * 0.04), t + 0.001);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.018);
    o.connect(g);
    o.start(t);
    o.stop(t + 0.022);

    const nodes = this._playTransientNoise({
      t,
      duration: 0.014,
      peak: Math.min(0.07, 0.018 + intensity * 0.028),
      bpHz: pingHz * 0.9,
      bpQ: 6,
    });
    this._scheduleVoiceTeardown([o, g, ...nodes], 0.03);
  }

  /**
   * Metallic deflector clack — brass diamond hit with inharmonic partials.
   */
  async playClack(impact = 0.5) {
    if (!(await this.ensureContextActive()) || this.muted || !this.master) return;

    const clamped = Math.max(0.05, Math.min(1.5, impact));
    const pitchJitter = 0.9 + Math.random() * 0.22;

    if (this._clackVoices.length >= MAX_CLACK_VOICES) {
      this._decayOldestClack();
    }

    const ctx = this.ctx;
    const t = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(this.master);

    const baseFreq = (1850 + clamped * 2200) * pitchJitter;
    const partials = [1, 1.43, 2.19, 3.07];
    const nodes = [];

    for (const ratio of partials) {
      const osc = ctx.createOscillator();
      osc.type = ratio < 2 ? 'triangle' : 'sine';
      const freq = baseFreq * ratio;
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(Math.max(320, freq * 0.32), t + 0.042);

      const partialGain = ctx.createGain();
      const peak = Math.min(0.16, (0.035 + clamped * 0.08) / partials.length);
      partialGain.gain.setValueAtTime(0.0001, t);
      partialGain.gain.exponentialRampToValueAtTime(peak, t + 0.0012);
      partialGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);

      const ring = ctx.createBiquadFilter();
      ring.type = 'bandpass';
      ring.frequency.value = freq * 0.92;
      ring.Q.value = 7 + clamped * 5;

      osc.connect(ring);
      ring.connect(partialGain);
      partialGain.connect(gain);
      osc.start(t);
      osc.stop(t + 0.058);
      nodes.push(osc, ring, partialGain);
    }

    const noiseNodes = this._playTransientNoise({
      t,
      duration: 0.032,
      peak: Math.min(0.14, 0.04 + clamped * 0.09),
      hpHz: 1600 + clamped * 1200,
    });
    nodes.push(...noiseNodes);

    const voice = {
      gain,
      startedAt: t,
      cleanup: () => {
        for (const node of nodes) {
          try {
            node?.disconnect?.();
          } catch {
            /* torn down */
          }
        }
        try {
          gain.disconnect();
        } catch {
          /* torn down */
        }
      },
    };
    this._clackVoices.push(voice);

    window.setTimeout(() => {
      voice.cleanup();
      this._releaseClackVoice(voice);
    }, 90);
  }

  _scheduleSettleBounce(startT, amp, freq) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;

    const bodyGain = ctx.createGain();
    bodyGain.connect(this.master);
    const bodyFilter = ctx.createBiquadFilter();
    bodyFilter.type = 'lowpass';
    bodyFilter.frequency.value = freq * 1.6;
    bodyFilter.Q.value = 0.8;

    const bodyOsc = ctx.createOscillator();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(freq, startT);
    bodyOsc.frequency.exponentialRampToValueAtTime(Math.max(42, freq * 0.55), startT + 0.08);

    bodyGain.gain.setValueAtTime(0.0001, startT);
    bodyGain.gain.exponentialRampToValueAtTime(amp, startT + 0.003);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, startT + 0.1);

    bodyOsc.connect(bodyFilter);
    bodyFilter.connect(bodyGain);
    bodyOsc.start(startT);
    bodyOsc.stop(startT + 0.11);

    const clickGain = ctx.createGain();
    clickGain.connect(this.master);
    const clickOsc = ctx.createOscillator();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(freq * 8.5, startT);
    clickOsc.frequency.exponentialRampToValueAtTime(freq * 2.8, startT + 0.012);
    clickGain.gain.setValueAtTime(0.0001, startT);
    clickGain.gain.exponentialRampToValueAtTime(amp * 0.45, startT + 0.0008);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, startT + 0.022);
    clickOsc.connect(clickGain);
    clickOsc.start(startT);
    clickOsc.stop(startT + 0.028);

    this._scheduleVoiceTeardown([bodyOsc, bodyFilter, bodyGain, clickOsc, clickGain], startT - ctx.currentTime + 0.14);
  }

  /**
   * Resonant pocket settle — rattling bounces then final mahogany thunk (T-0).
   */
  async playSettle() {
    if (!(await this.ensureContextActive()) || this.muted || !this.master) return;
    if (this._settlePlaying) return;
    this._settlePlaying = true;

    const ctx = this.ctx;
    const t = ctx.currentTime;

    const bounces = [
      { delay: 0, amp: 0.16, freq: 220 },
      { delay: 0.085, amp: 0.11, freq: 175 },
      { delay: 0.155, amp: 0.075, freq: 138 },
      { delay: 0.22, amp: 0.05, freq: 108 },
    ];
    for (const b of bounces) {
      this._scheduleSettleBounce(t + b.delay, b.amp, b.freq);
    }

    const finalT = t + 0.3;

    // Deep hollow mahogany body — triangle oscillator exponential decay
    const bodyGain = ctx.createGain();
    bodyGain.connect(this.master);
    const bodyFilter = ctx.createBiquadFilter();
    bodyFilter.type = 'lowpass';
    bodyFilter.frequency.value = 240;
    bodyFilter.Q.value = 1.1;
    const bodyOsc = ctx.createOscillator();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(152, finalT);
    bodyOsc.frequency.exponentialRampToValueAtTime(44, finalT + 0.48);
    bodyGain.gain.setValueAtTime(0.0001, finalT);
    bodyGain.gain.exponentialRampToValueAtTime(0.22, finalT + 0.014);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, finalT + 0.52);
    bodyOsc.connect(bodyFilter);
    bodyFilter.connect(bodyGain);
    bodyOsc.start(finalT);
    bodyOsc.stop(finalT + 0.55);

    // Wood resonance chamber — bandpass swell
    const woodGain = ctx.createGain();
    woodGain.connect(this.master);
    const woodFilter = ctx.createBiquadFilter();
    woodFilter.type = 'bandpass';
    woodFilter.frequency.setValueAtTime(108, finalT);
    woodFilter.frequency.exponentialRampToValueAtTime(68, finalT + 0.38);
    woodFilter.Q.value = 2.6;
    const woodOsc = ctx.createOscillator();
    woodOsc.type = 'sine';
    woodOsc.frequency.setValueAtTime(86, finalT);
    woodOsc.frequency.exponentialRampToValueAtTime(52, finalT + 0.4);
    woodGain.gain.setValueAtTime(0.0001, finalT);
    woodGain.gain.exponentialRampToValueAtTime(0.12, finalT + 0.02);
    woodGain.gain.exponentialRampToValueAtTime(0.0001, finalT + 0.46);
    woodOsc.connect(woodFilter);
    woodFilter.connect(woodGain);
    woodOsc.start(finalT);
    woodOsc.stop(finalT + 0.5);

    // High ivory click on pocket lip contact
    const clickGain = ctx.createGain();
    clickGain.connect(this.master);
    const clickOsc = ctx.createOscillator();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(3400, finalT);
    clickOsc.frequency.exponentialRampToValueAtTime(980, finalT + 0.02);
    clickGain.gain.setValueAtTime(0.0001, finalT);
    clickGain.gain.exponentialRampToValueAtTime(0.1, finalT + 0.001);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, finalT + 0.034);
    clickOsc.connect(clickGain);
    clickOsc.start(finalT);
    clickOsc.stop(finalT + 0.042);

    this.setRolling(0);
    this._scheduleVoiceTeardown(
      [bodyOsc, bodyFilter, bodyGain, woodOsc, woodFilter, woodGain, clickOsc, clickGain],
      finalT - t + 0.58
    );

    window.setTimeout(() => {
      this._settlePlaying = false;
    }, 900);
  }

  /** Casino coin-cascade win chime. */
  async playWinFanfare() {
    if (!(await this.ensureContextActive()) || this.muted || !this.master) return;

    const t = this.ctx.currentTime;
    const coins = [
      { freq: 1568, delay: 0, amp: 0.11 },
      { freq: 1976, delay: 0.055, amp: 0.1 },
      { freq: 2349, delay: 0.11, amp: 0.09 },
      { freq: 2794, delay: 0.17, amp: 0.08 },
      { freq: 3136, delay: 0.24, amp: 0.07 },
    ];

    for (const coin of coins) {
      const start = t + coin.delay;
      const g = this.ctx.createGain();
      g.connect(this.master);
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(coin.freq, start);
      o.frequency.exponentialRampToValueAtTime(coin.freq * 0.92, start + 0.08);
      const ring = this.ctx.createBiquadFilter();
      ring.type = 'bandpass';
      ring.frequency.value = coin.freq;
      ring.Q.value = 12;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(coin.amp, start + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
      o.connect(ring);
      ring.connect(g);
      o.start(start);
      o.stop(start + 0.26);
      this._scheduleVoiceTeardown([o, ring, g], coin.delay + 0.3);
    }
  }

  /** Ceramic chip stack tick on bet placement. */
  async playChipPlace(chipValue, uiTheme) {
    return this.playChipLand(chipValue ?? 25, uiTheme);
  }

  /**
   * Chip land tick — denomination-aware pitch, theme timbre.
   */
  async playChipLand(chipValue = 25, uiTheme) {
    if (!(await this.ensureContextActive()) || this.muted || !this.master) return;

    const profile = chipTimbreForTheme(uiTheme);
    const { high, low } = chipLandPitch(chipValue, profile);
    const ctx = this.ctx;
    const t = ctx.currentTime;

    for (const [offset, freq, amp] of [
      [0, high, profile.landPeak],
      [0.011, low, profile.landPeak * 0.68],
    ]) {
      const start = t + offset;
      const g = ctx.createGain();
      g.connect(this.master);
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.setValueAtTime(freq, start);
      o.frequency.exponentialRampToValueAtTime(freq * 0.62, start + 0.038);
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = profile.id === 'neon' ? 640 : 520;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(amp, start + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.05);
      o.connect(hp);
      hp.connect(g);
      o.start(start);
      o.stop(start + 0.054);
      this._scheduleVoiceTeardown([o, hp, g], offset + 0.07);
    }

    const nodes = this._playTransientNoise({
      t,
      duration: 0.022,
      peak: profile.landPeak * 0.48,
      bpHz: profile.id === 'neon' ? high * 0.85 : null,
      hpHz: profile.id === 'neon' ? null : 900,
      bpQ: profile.whooshQ,
    });
    this._scheduleVoiceTeardown(nodes, 0.05);
  }

  /** Air whoosh while dragging a chip across the felt. */
  async playChipDragWhoosh(speedPxPerMs = 0.4, uiTheme) {
    if (!(await this.ensureContextActive()) || this.muted || !this.master) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    if (now - this._lastChipWhooshAt < 0.042) return;
    this._lastChipWhooshAt = now;

    const profile = chipTimbreForTheme(uiTheme);
    const intensity = chipDragWhooshIntensity(speedPxPerMs);
    const t = now;
    const peak = profile.whooshPeak * intensity;

    const nodes = this._playTransientNoise({
      t,
      duration: 0.028 + intensity * 0.02,
      peak,
      bpHz: profile.whooshBp + intensity * 180,
      bpQ: profile.whooshQ,
    });

    const g = ctx.createGain();
    g.connect(this.master);
    const o = ctx.createOscillator();
    o.type = 'sine';
    const sweep = profile.whooshBp * (0.9 + intensity * 0.15);
    o.frequency.setValueAtTime(sweep, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(180, sweep * 0.55), t + 0.03);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak * 0.55, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.034);
    o.connect(g);
    o.start(t);
    o.stop(t + 0.038);

    this._scheduleVoiceTeardown([o, g, ...nodes], 0.06);
  }

  /** Dealer "no more bets" — double wooden table knock. */
  async playBetLock() {
    if (!(await this.ensureContextActive()) || this.muted || !this.master) return;

    const ctx = this.ctx;
    const t = ctx.currentTime;
    const [hi, lo] = FEEDBACK_CONFIG.audio.betLockHz;

    for (const [freq, offset, amp] of [
      [hi, 0, 0.11],
      [lo, 0.09, 0.09],
    ]) {
      const start = t + offset;
      const g = ctx.createGain();
      g.connect(this.master);
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.setValueAtTime(freq, start);
      o.frequency.exponentialRampToValueAtTime(freq * 0.72, start + 0.06);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = freq * 1.4;
      lp.Q.value = 0.7;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(amp, start + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.1);
      o.connect(lp);
      lp.connect(g);
      o.start(start);
      o.stop(start + 0.12);

      const knock = this._playTransientNoise({
        t: start,
        duration: 0.018,
        peak: amp * 0.35,
        bpHz: freq * 2.2,
        bpQ: 3.5,
      });
      this._scheduleVoiceTeardown([o, lp, g, ...knock], offset + 0.14);
    }
  }

  /** Ball release onto the wheel — whoosh then track contact. */
  async playSpinCue() {
    if (!(await this.ensureContextActive()) || this.muted || !this.master) return;

    const ctx = this.ctx;
    const t = ctx.currentTime;
    const dur = FEEDBACK_CONFIG.audio.spinCueMs / 1000;

    const g = ctx.createGain();
    g.connect(this.master);
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(72, t);
    o.frequency.exponentialRampToValueAtTime(195, t + dur * 0.7);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(220, t);
    lp.frequency.exponentialRampToValueAtTime(720, t + dur);
    lp.Q.value = 0.85;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.075, t + 0.035);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp);
    lp.connect(g);
    o.start(t);
    o.stop(t + dur + 0.02);

    const whoosh = this._playTransientNoise({
      t,
      duration: dur * 0.85,
      peak: 0.055,
      bpHz: 480,
      bpQ: 1.2,
    });

    window.setTimeout(() => {
      this.playOrbitTick(1.1);
      this.playOrbitTick(0.95);
    }, Math.floor(dur * 0.55 * 1000));

    this._scheduleVoiceTeardown([o, lp, g, ...whoosh], dur + 0.08);
  }

  setMasterVolume(v) {
    if (this.master && !this.muted && this.ctx) {
      this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
    }
  }
}

/** Factory — single engine instance per game session. */
export function createAudioEngine() {
  return new RouletteAudioEngine();
}

/** Linear map Rapier impact speed → clack intensity [0.08, 1.4]. */
export function impactToClackIntensity(impactSpeed) {
  return Math.max(0.08, Math.min(1.4, impactSpeed * 0.85));
}
