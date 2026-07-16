import { describe, expect, it } from 'vitest';
import {
  createPerformanceGuard,
  QUALITY_TIERS,
  resolveGodModeSettings,
} from './performanceGuard.js';

function makeProfile(mobile = false, lowTier = false) {
  return {
    mobile,
    lowTier,
    devicePixelRatio: 2,
    hardwareConcurrency: lowTier ? 4 : 8,
    deviceMemory: lowTier ? 4 : 8,
  };
}

describe('performanceGuard', () => {
  describe('QUALITY_TIERS', () => {
    it('defines escalating visual fidelity per tier', () => {
      expect(QUALITY_TIERS.high.quantumArc).toBe(true);
      expect(QUALITY_TIERS.high.postFx).toBe(true);
      expect(QUALITY_TIERS.medium.chromaticAberration).toBe(false);
      expect(QUALITY_TIERS.low.postFx).toBe(false);
      expect(QUALITY_TIERS.low.quantumArc).toBe(false);
    });
  });

  describe('resolveGodModeSettings', () => {
    const base = QUALITY_TIERS.high;

    it('returns base unchanged at step 0', () => {
      expect(resolveGodModeSettings(base, 0)).toBe(base);
    });

    it('steps down god-mode features progressively', () => {
      const step1 = resolveGodModeSettings(base, 1)!;
      expect(step1.godRays).toBe('gradient');

      const step2 = resolveGodModeSettings(base, 2)!;
      expect(step2.loungeDust).toBe(false);

      const step3 = resolveGodModeSettings(base, 3)!;
      expect(step3.ghostChipsFull).toBe(false);

      const step4 = resolveGodModeSettings(base, 4)!;
      expect(step4.quantumArc).toBe(false);
      expect(step4.ballVapor).toBe(false);
    });
  });

  describe('createPerformanceGuard', () => {
    it('starts at high tier with stable fps', () => {
      const guard = createPerformanceGuard(makeProfile());
      const result = guard.tick(16.67);
      expect(result.tier).toBe('high');
      expect(guard.tier).toBe('high');
      expect(result.fps).toBeGreaterThan(50);
      expect(result.settings.quantumArc).toBe(true);
    });

    it('exposes device profile and settings', () => {
      const profile = makeProfile(true, true);
      const guard = createPerformanceGuard(profile);
      expect(guard.deviceProfile).toBe(profile);
      expect(guard.getSettings().dprMax).toBe(1);
    });

    it('downgrades tier after sustained low fps', () => {
      const guard = createPerformanceGuard(makeProfile());
      guard.tick(16.67);
      for (let i = 0; i < 5; i += 1) {
        guard.tick(100);
      }
      expect(guard.tier).toBe('medium');
      expect(guard.getSettings().chromaticAberration).toBe(false);
    });

    it('downgrades to low tier after extended poor performance', () => {
      const guard = createPerformanceGuard(makeProfile());
      for (let i = 0; i < 8; i += 1) guard.tick(100);
      for (let i = 0; i < 8; i += 1) guard.tick(100);
      expect(guard.tier).toBe('low');
      expect(guard.getSettings().postFx).toBe(false);
    });

    it('increments godStep under fps pressure', () => {
      const guard = createPerformanceGuard(makeProfile());
      guard.tick(100);
      guard.tick(100);
      expect(guard.godStep).toBeGreaterThanOrEqual(1);
    });

    it('recovers tier after sustained good fps from low', () => {
      const guard = createPerformanceGuard(makeProfile());
      for (let i = 0; i < 16; i += 1) guard.tick(100);
      expect(guard.tier).toBe('low');

      for (let i = 0; i < 80; i += 1) guard.tick(10);
      expect(guard.tier).toBe('medium');
    });
  });
});
