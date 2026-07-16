import { describe, expect, it } from 'vitest';
import * as corePerf from '../core/performanceGuard.js';
import * as coreTimer from '../core/timer.js';
import * as libPerf from './performanceGuard.js';
import * as libTimer from './timer.js';

const TIMER_EXPORTS = [
  'CYCLE_SECONDS',
  'PHASES',
  'BALL_DROP_AT',
  'BALL_PHYSICS_AT',
  'BALL_MAGNET_AT',
  'BALL_SETTLE_AT',
  'getCycleSecond',
  'getSecondsRemaining',
  'getPhase',
  'getCycleId',
  'getSecondsToBallDrop',
] as const;

const PERF_EXPORTS = ['QUALITY_TIERS', 'resolveGodModeSettings', 'createPerformanceGuard'] as const;

function atUnixSecond(unixSec: number): number {
  return unixSec * 1000;
}

describe('libShims', () => {
  describe('timer legacy shim', () => {
    it('re-exports the same timer bindings as @core', () => {
      for (const key of TIMER_EXPORTS) {
        expect(libTimer[key]).toBe(coreTimer[key]);
      }
    });

    it('delegates phase math to @core/timer', () => {
      const nowMs = atUnixSecond(1_000_007);
      expect(libTimer.getCycleSecond(nowMs)).toBe(coreTimer.getCycleSecond(nowMs));
      expect(libTimer.getPhase(nowMs)).toEqual(coreTimer.getPhase(nowMs));
      expect(libTimer.getSecondsToBallDrop(nowMs)).toBe(coreTimer.getSecondsToBallDrop(nowMs));
    });
  });

  describe('performanceGuard legacy shim', () => {
    it('re-exports the same performance guard bindings as @core', () => {
      for (const key of PERF_EXPORTS) {
        expect(libPerf[key]).toBe(corePerf[key]);
      }
    });

    it('creates guards through the legacy import path', () => {
      const profile = {
        mobile: false,
        lowTier: false,
        devicePixelRatio: 2,
        hardwareConcurrency: 8,
        deviceMemory: 8,
      };
      const viaCore = corePerf.createPerformanceGuard(profile);
      const viaShim = libPerf.createPerformanceGuard(profile);
      expect(viaShim.tier).toBe(viaCore.tier);
      expect(viaShim.getSettings()).toEqual(viaCore.getSettings());
    });
  });
});
