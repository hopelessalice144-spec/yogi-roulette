/**
 * Physical-modeling Web Audio engine — LFO friction hum, metallic clacks, wood pocket settle.
 * Lazy init after user gesture; voice pooling prevents HF clipping.
 */

import { FEEDBACK_CONFIG } from '../core/feedbackConfig.js';

const MAX_CLACK_VOICES = FEEDBACK_CONFIG.audio.maxClackVoices;
const ROLL_BASE_HZ = FEEDBACK_CONFIG.audio.rollBaseHz;
const MASTER_GAIN = FEEDBACK_CONFIG.audio.masterGain;
const ROLL_LFO_HZ = 4.2;

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
    this.rollLfo = null;
    this.rollLfoGain = null;
    this.spinGain = null;
    this.spinOsc = null;
    this.muted = false;
    this._rollingSpeed = 0;
    /** @type {{ gain: GainNode, startedAt: number, cleanup: () => void }[]} */
    this._clackVoices = [];
    this._noiseBuffer = null;
    this._settlePlaying = false;
  }

  /** Build graph only after explicit user gesture unlock. */
  init() {
    if (this.ctx) return this.ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;

    const ctx = new AC();
    this.ctx = ctx;

    this.limiter = ctx.createDynamicsCompressor();
    this.limiter.threshold.value = -14;
    this.limiter.knee.value = 6;
    this.limiter.ratio.value = 10;
    this.limiter.attack.value = 0.002;
    this.limiter.release.value = 0.12;

    this.master = ctx.createGain();
    this.master.gain.value = MASTER_GAIN;
    this.master.connect(this.limiter);
    this.limiter.connect(ctx.destination);

    // Low-frequency friction hum — filtered brown noise
    this.rumbleGain = ctx.createGain();
    this.rumbleGain.gain.value = 0;
    this.rumbleFilter = ctx.createBiquadFilter();
    this.rumbleFilter.type = 'lowpass';
    this.rumbleFilter.frequency.value = ROLL_BASE_HZ + 40;
    this.rumbleFilter.Q.value = 0.75;
    this.rumbleGain.connect(this.rumbleFilter);
    this.rumbleFilter.connect(this.master);

    const bufferSize = 2 * ctx.sampleRate;
    this._noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = this._noiseBuffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      last = last * 0.985 + white * 0.015;
      data[i] = last * 2.2;
    }
    this.rumbleSource = ctx.createBufferSource();
    this.rumbleSource.buffer = this._noiseBuffer;
    this.rumbleSource.loop = true;
    this.rumbleSource.connect(this.rumbleGain);
    this.rumbleSource.start();

    // Secondary bandpass friction texture (ivory on mahogany)
    this.frictionGain = ctx.createGain();
    this.frictionGain.gain.value = 0;
    this.frictionFilter = ctx.createBiquadFilter();
    this.frictionFilter.type = 'bandpass';
    this.frictionFilter.frequency.value = 95;
    this.frictionFilter.Q.value = 1.1;
    this.frictionGain.connect(this.frictionFilter);
    this.frictionFilter.connect(this.master);

    this.frictionSource = ctx.createBufferSource();
    this.frictionSource.buffer = this._noiseBuffer;
    this.frictionSource.loop = true;
    this.frictionSource.connect(this.frictionGain);
    this.frictionSource.start();

    // LFO breathes the hum like a live wooden wheel
    this.rollLfo = ctx.createOscillator();
    this.rollLfo.type = 'sine';
    this.rollLfo.frequency.value = ROLL_LFO_HZ;
    this.rollLfoGain = ctx.createGain();
    this.rollLfoGain.gain.value = 0;
    this.rollLfo.connect(this.rollLfoGain);
    this.rollLfoGain.connect(this.rumbleGain.gain);
    this.rollLfoGain.connect(this.frictionGain.gain);
    this.rollLfo.start();

    // Sub-harmonic body tone
    this.spinGain = ctx.createGain();
    this.spinGain.gain.value = 0;
    this.spinOsc = ctx.createOscillator();
    this.spinOsc.type = 'sine';
    this.spinOsc.frequency.value = ROLL_BASE_HZ;
    const spinFilter = ctx.createBiquadFilter();
    spinFilter.type = 'lowpass';
    spinFilter.frequency.value = 180;
    spinFilter.Q.value = 0.6;
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
    const vol = Math.min(0.26, tangential * 0.095 + total * 0.018);
    this.rumbleGain.gain.setTargetAtTime(vol, t, 0.09);
    this.rumbleFilter.frequency.setTargetAtTime(
      ROLL_BASE_HZ + tangential * 42 + Math.abs(vy) * 22,
      t,
      0.12
    );
    this.rumbleFilter.Q.setTargetAtTime(0.5 + tangential * 0.1, t, 0.14);

    if (this.frictionGain && this.frictionFilter) {
      const fVol = Math.min(0.14, tangential * 0.048 + total * 0.008);
      this.frictionGain.gain.setTargetAtTime(fVol, t, 0.1);
      this.frictionFilter.frequency.setTargetAtTime(
        72 + tangential * 18 + Math.abs(vy) * 8,
        t,
        0.13
      );
    }

    if (this.rollLfo && this.rollLfoGain) {
      const lfoDepth = Math.min(0.045, tangential * 0.024);
      this.rollLfoGain.gain.setTargetAtTime(lfoDepth, t, 0.15);
      this.rollLfo.frequency.setTargetAtTime(
        ROLL_LFO_HZ + tangential * 1.8,
        t,
        0.18
      );
    }

    if (this.spinGain && this.spinOsc) {
      const pitch = ROLL_BASE_HZ + tangential * 8.5 + vy * 4;
      this.spinGain.gain.setTargetAtTime(Math.min(0.09, tangential * 0.022), t, 0.11);
      this.spinOsc.frequency.setTargetAtTime(
        Math.max(38, Math.min(240, pitch)),
        t,
        0.14
      );
    }
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
      this.rollLfo?.stop();
      this.spinOsc?.stop();
    } catch {
      /* ignore */
    }
    try {
      this.rumbleSource?.disconnect();
      this.frictionSource?.disconnect();
      this.rollLfo?.disconnect();
      this.spinOsc?.disconnect();
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
    this.rollLfo = null;
    this.rollLfoGain = null;
    this.spinGain = null;
    this.spinOsc = null;
    this._noiseBuffer = null;
  }

  /**
   * Metallic pin clack — pitch + volume scale linearly with Rapier impact velocity.
   */
  async playClack(impact = 0.5) {
    if (!(await this.ensureContextActive()) || this.muted || !this.master) return;

    const clamped = Math.max(0.05, Math.min(1.5, impact));

    if (this._clackVoices.length >= MAX_CLACK_VOICES) {
      this._decayOldestClack();
    }

    const ctx = this.ctx;
    const t = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(this.master);

    const peakFreq = 2200 + clamped * 1600;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(peakFreq, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(420, peakFreq * 0.28), t + 0.038);

    const peak = Math.min(0.24, 0.06 + clamped * 0.12);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + 0.0015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.048);

    const ring = ctx.createBiquadFilter();
    ring.type = 'bandpass';
    ring.frequency.value = peakFreq * 0.85;
    ring.Q.value = 8 + clamped * 6;
    osc.connect(ring);
    ring.connect(gain);
    osc.start(t);
    osc.stop(t + 0.055);

    const noise = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.028), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    noise.buffer = buf;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(Math.min(0.2, 0.05 + clamped * 0.11), t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.028);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1400 + clamped * 900;
    noise.connect(hp);
    hp.connect(ng);
    ng.connect(this.master);
    noise.start(t);
    noise.stop(t + 0.034);

    const voice = {
      gain,
      startedAt: t,
      cleanup: () => {
        try {
          osc.disconnect();
          ring.disconnect();
          noise.disconnect();
          gain.disconnect();
        } catch {
          /* already torn down */
        }
      },
    };
    this._clackVoices.push(voice);

    window.setTimeout(() => {
      voice.cleanup();
      this._releaseClackVoice(voice);
    }, 80);
  }

  /**
   * Resonant wood pocket settle (T-0) — LF triangle ramp + ivory click.
   */
  async playSettle() {
    if (!(await this.ensureContextActive()) || this.muted || !this.master) return;
    if (this._settlePlaying) return;
    this._settlePlaying = true;

    const ctx = this.ctx;
    const t = ctx.currentTime;

    // Deep hollow mahogany body — triangle oscillator exponential decay
    const bodyGain = ctx.createGain();
    bodyGain.connect(this.master);
    const bodyFilter = ctx.createBiquadFilter();
    bodyFilter.type = 'lowpass';
    bodyFilter.frequency.value = 260;
    bodyFilter.Q.value = 0.9;
    const bodyOsc = ctx.createOscillator();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(168, t);
    bodyOsc.frequency.exponentialRampToValueAtTime(48, t + 0.42);
    bodyGain.gain.setValueAtTime(0.0001, t);
    bodyGain.gain.exponentialRampToValueAtTime(0.18, t + 0.012);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.46);
    bodyOsc.connect(bodyFilter);
    bodyFilter.connect(bodyGain);
    bodyOsc.start(t);
    bodyOsc.stop(t + 0.5);

    // Wood resonance chamber — bandpass swell
    const woodGain = ctx.createGain();
    woodGain.connect(this.master);
    const woodFilter = ctx.createBiquadFilter();
    woodFilter.type = 'bandpass';
    woodFilter.frequency.setValueAtTime(118, t);
    woodFilter.frequency.exponentialRampToValueAtTime(72, t + 0.35);
    woodFilter.Q.value = 2.4;
    const woodOsc = ctx.createOscillator();
    woodOsc.type = 'sine';
    woodOsc.frequency.setValueAtTime(92, t);
    woodOsc.frequency.exponentialRampToValueAtTime(58, t + 0.38);
    woodGain.gain.setValueAtTime(0.0001, t);
    woodGain.gain.exponentialRampToValueAtTime(0.1, t + 0.018);
    woodGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.44);
    woodOsc.connect(woodFilter);
    woodFilter.connect(woodGain);
    woodOsc.start(t);
    woodOsc.stop(t + 0.48);

    // High ivory click on pocket lip contact
    const clickGain = ctx.createGain();
    clickGain.connect(this.master);
    const clickOsc = ctx.createOscillator();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(3200, t);
    clickOsc.frequency.exponentialRampToValueAtTime(1100, t + 0.018);
    clickGain.gain.setValueAtTime(0.0001, t);
    clickGain.gain.exponentialRampToValueAtTime(0.09, t + 0.001);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.032);
    clickOsc.connect(clickGain);
    clickOsc.start(t);
    clickOsc.stop(t + 0.04);

    this.setRolling(0);
    this._scheduleVoiceTeardown(
      [bodyOsc, bodyFilter, bodyGain, woodOsc, woodFilter, woodGain, clickOsc, clickGain],
      0.55
    );

    window.setTimeout(() => {
      this._settlePlaying = false;
    }, 520);
  }

  async playWinFanfare() {
    if (!(await this.ensureContextActive()) || this.muted || !this.master) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const g = this.ctx.createGain();
      g.connect(this.master);
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq;
      const start = t + i * 0.09;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(0.12, start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.34);
      o.connect(g);
      o.start(start);
      o.stop(start + 0.38);
      this._scheduleVoiceTeardown([o, g], start - t + 0.42);
    });
  }

  /** Soft ivory chip tick on bet placement. */
  async playChipPlace() {
    if (!(await this.ensureContextActive()) || this.muted || !this.master) return;

    const ctx = this.ctx;
    const t = ctx.currentTime;
    const g = ctx.createGain();
    g.connect(this.master);
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(FEEDBACK_CONFIG.audio.chipPlaceHz, t);
    o.frequency.exponentialRampToValueAtTime(620, t + 0.04);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.07, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    o.connect(g);
    o.start(t);
    o.stop(t + 0.055);
    this._scheduleVoiceTeardown([o, g], 0.07);
  }

  /** Descending lock tone when betting closes. */
  async playBetLock() {
    if (!(await this.ensureContextActive()) || this.muted || !this.master) return;

    const ctx = this.ctx;
    const t = ctx.currentTime;
    const [hi, lo] = FEEDBACK_CONFIG.audio.betLockHz;
    for (const [freq, offset] of [
      [hi, 0],
      [lo, 0.07],
    ]) {
      const g = ctx.createGain();
      g.connect(this.master);
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = freq;
      const start = t + offset;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(0.09, start + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);
      o.connect(g);
      o.start(start);
      o.stop(start + 0.14);
      this._scheduleVoiceTeardown([o, g], offset + 0.16);
    }
  }

  /** Orbital spin swell at T-5 ball drop. */
  async playSpinCue() {
    if (!(await this.ensureContextActive()) || this.muted || !this.master) return;

    const ctx = this.ctx;
    const t = ctx.currentTime;
    const dur = FEEDBACK_CONFIG.audio.spinCueMs / 1000;

    const g = ctx.createGain();
    g.connect(this.master);
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(90, t);
    o.frequency.exponentialRampToValueAtTime(220, t + dur * 0.65);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(280, t);
    lp.frequency.exponentialRampToValueAtTime(680, t + dur);
    lp.Q.value = 0.7;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.06, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp);
    lp.connect(g);
    o.start(t);
    o.stop(t + dur + 0.02);
    this._scheduleVoiceTeardown([o, lp, g], dur + 0.05);
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
