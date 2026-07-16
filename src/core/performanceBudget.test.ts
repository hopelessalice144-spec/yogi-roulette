import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyRenderBudget,
  BUNDLE_BUDGET_KB,
  detectDeviceProfile,
  FPS_BUDGET,
  fpsTier,
  RENDER_BUDGET,
  resolveDprCap,
} from './performanceBudget.js';

function mockDeviceEnv(options: {
  mobile?: boolean;
  dpr?: number;
  cores?: number;
  memory?: number;
}): void {
  vi.stubGlobal('window', {
    matchMedia: vi.fn().mockReturnValue({ matches: options.mobile ?? false }),
    devicePixelRatio: options.dpr ?? 2,
  });
  vi.stubGlobal('navigator', {
    hardwareConcurrency: options.cores ?? 8,
    deviceMemory: options.memory ?? 8,
  });
}

function makeProfile(mobile: boolean, lowTier: boolean) {
  return {
    mobile,
    lowTier,
    devicePixelRatio: 2,
    hardwareConcurrency: lowTier ? 4 : 8,
    deviceMemory: lowTier ? 4 : 8,
  };
}

describe('performanceBudget', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('exports FPS and bundle budgets', () => {
    expect(FPS_BUDGET.target).toBe(60);
    expect(FPS_BUDGET.downgradeBelow).toBe(45);
    expect(BUNDLE_BUDGET_KB.appJsGzipMax).toBe(50);
    expect(RENDER_BUDGET.mobileMaxDpr).toBe(1.25);
  });

  describe('fpsTier', () => {
    it('maps fps to quality tiers', () => {
      expect(fpsTier(60)).toBe('high');
      expect(fpsTier(50)).toBe('medium');
      expect(fpsTier(40)).toBe('low');
    });
  });

  describe('detectDeviceProfile', () => {
    it('returns safe defaults without window', () => {
      vi.stubGlobal('window', undefined);
      expect(detectDeviceProfile()).toEqual({
        mobile: false,
        lowTier: false,
        devicePixelRatio: 1,
        hardwareConcurrency: 8,
        deviceMemory: 8,
      });
    });

    it('detects mobile viewport', () => {
      mockDeviceEnv({ mobile: true, cores: 8, memory: 8 });
      const profile = detectDeviceProfile();
      expect(profile.mobile).toBe(true);
      expect(profile.lowTier).toBe(false);
    });

    it('flags low-tier mobile hardware', () => {
      mockDeviceEnv({ mobile: true, cores: 4, memory: 4 });
      const profile = detectDeviceProfile();
      expect(profile.lowTier).toBe(true);
    });
  });

  describe('resolveDprCap', () => {
    it('returns tier caps on desktop', () => {
      const desktop = makeProfile(false, false);
      expect(resolveDprCap('high', desktop)).toBe(2);
      expect(resolveDprCap('medium', desktop)).toBe(1.5);
      expect(resolveDprCap('low', desktop)).toBe(1);
    });

    it('caps mobile high tier', () => {
      expect(resolveDprCap('high', makeProfile(true, false))).toBe(RENDER_BUDGET.mobileMaxDpr);
    });

    it('caps low-tier mobile to 1', () => {
      expect(resolveDprCap('high', makeProfile(true, true))).toBe(
        RENDER_BUDGET.mobileLowTierMaxDpr
      );
    });
  });

  describe('applyRenderBudget', () => {
    it('clamps dprMax to resolved cap', () => {
      const settings = { dprMax: 2, shadowMapSize: 2048 };
      const applied = applyRenderBudget(settings, 'high', makeProfile(true, false));
      expect(applied.dprMax).toBe(RENDER_BUDGET.mobileMaxDpr);
    });

    it('reduces shadow map on low-tier devices', () => {
      const settings = { dprMax: 1, shadowMapSize: 2048 };
      const applied = applyRenderBudget(settings, 'low', makeProfile(true, true));
      expect(applied.shadowMapSize).toBe(RENDER_BUDGET.shadowMapMedium);
    });

    it('preserves settings when within budget', () => {
      const settings = { dprMax: 1.5, foo: 'bar' };
      const applied = applyRenderBudget(settings, 'medium', makeProfile(false, false));
      expect(applied.dprMax).toBe(1.5);
      expect(applied.foo).toBe('bar');
    });
  });
});
