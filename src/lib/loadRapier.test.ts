import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const markProfile = vi.fn();
const measureProfile = vi.fn();

vi.mock('../core/profileHarness.js', () => ({
  markProfile,
  measureProfile,
}));

vi.mock('@react-three/rapier', () => ({
  Physics: 'Physics',
}));

vi.mock('../scene/RapierStage.jsx', () => ({
  RapierStage: 'RapierStage',
}));

async function loadModule() {
  return import('./loadRapier.js');
}

describe('loadRapier', () => {
  beforeEach(() => {
    vi.resetModules();
    markProfile.mockReset();
    measureProfile.mockReset();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('exports prefetch timing constant', async () => {
    const { RAPIER_PREFETCH_AT } = await loadModule();
    expect(RAPIER_PREFETCH_AT).toBe(17);
  });

  describe('shouldPrefetchPhysics', () => {
    it('returns false without a clock', async () => {
      const { shouldPrefetchPhysics } = await loadModule();
      expect(shouldPrefetchPhysics(null)).toBe(false);
    });

    it('prefetches during late betting, lock, and spin', async () => {
      const { shouldPrefetchPhysics, RAPIER_PREFETCH_AT } = await loadModule();
      expect(shouldPrefetchPhysics({ name: 'betting', cycleSecond: RAPIER_PREFETCH_AT - 1 })).toBe(
        false,
      );
      expect(shouldPrefetchPhysics({ name: 'betting', cycleSecond: RAPIER_PREFETCH_AT })).toBe(
        true,
      );
      expect(shouldPrefetchPhysics({ name: 'locked', cycleSecond: 22 })).toBe(true);
      expect(shouldPrefetchPhysics({ name: 'spinning', cycleSecond: 27 })).toBe(true);
    });

    it('prefetches earlier on low quality tier', async () => {
      const { shouldPrefetchPhysics, RAPIER_PREFETCH_AT_LOW, RAPIER_PREFETCH_AT } =
        await loadModule();
      expect(
        shouldPrefetchPhysics({ name: 'betting', cycleSecond: RAPIER_PREFETCH_AT_LOW }, 'low'),
      ).toBe(true);
      expect(
        shouldPrefetchPhysics(
          { name: 'betting', cycleSecond: RAPIER_PREFETCH_AT_LOW - 1 },
          'low',
        ),
      ).toBe(false);
      expect(
        shouldPrefetchPhysics({ name: 'betting', cycleSecond: RAPIER_PREFETCH_AT_LOW }, 'high'),
      ).toBe(false);
    });

    it('prefetches between low and high on medium tier', async () => {
      const { shouldPrefetchPhysics, RAPIER_PREFETCH_AT_MEDIUM, RAPIER_PREFETCH_AT_LOW } =
        await loadModule();
      expect(
        shouldPrefetchPhysics({ name: 'betting', cycleSecond: RAPIER_PREFETCH_AT_MEDIUM }, 'medium'),
      ).toBe(true);
      expect(
        shouldPrefetchPhysics(
          { name: 'betting', cycleSecond: RAPIER_PREFETCH_AT_MEDIUM - 1 },
          'medium',
        ),
      ).toBe(false);
      expect(
        shouldPrefetchPhysics(
          { name: 'betting', cycleSecond: RAPIER_PREFETCH_AT_LOW },
          'medium',
        ),
      ).toBe(false);
    });

    it('maps quality tier to prefetch second', async () => {
      const { rapierPrefetchAt, RAPIER_PREFETCH_AT, RAPIER_PREFETCH_AT_MEDIUM, RAPIER_PREFETCH_AT_LOW } =
        await loadModule();
      expect(rapierPrefetchAt('low')).toBe(RAPIER_PREFETCH_AT_LOW);
      expect(rapierPrefetchAt('medium')).toBe(RAPIER_PREFETCH_AT_MEDIUM);
      expect(rapierPrefetchAt('high')).toBe(RAPIER_PREFETCH_AT);
      expect(rapierPrefetchAt()).toBe(RAPIER_PREFETCH_AT);
    });
  });

  describe('shouldMountPhysics', () => {
    it('mounts only during locked and spinning phases', async () => {
      const { shouldMountPhysics } = await loadModule();
      expect(shouldMountPhysics(null)).toBe(false);
      expect(shouldMountPhysics({ name: 'betting', cycleSecond: 18 })).toBe(false);
      expect(shouldMountPhysics({ name: 'locked', cycleSecond: 22 })).toBe(true);
      expect(shouldMountPhysics({ name: 'spinning', cycleSecond: 28 })).toBe(true);
    });
  });

  describe('prefetchRapier', () => {
    it('is idempotent and records profile marks', async () => {
      const { prefetchRapier } = await loadModule();
      const first = prefetchRapier();
      const second = prefetchRapier();

      expect(first).toBe(second);
      const mod = await first;
      expect(mod.Physics).toBe('Physics');
      expect(markProfile).toHaveBeenCalledTimes(1);
      expect(markProfile).toHaveBeenCalledWith('rapier-prefetch-start');
      expect(measureProfile).toHaveBeenCalledWith('rapier-wasm-load', 'rapier-prefetch-start');
    });
  });

  describe('loadRapierStage', () => {
    it('chains WASM prefetch with the RapierStage chunk', async () => {
      const { loadRapierStage } = await loadModule();
      const first = loadRapierStage();
      const second = loadRapierStage();

      expect(first).toBe(second);
      const mod = await first;
      expect(mod.RapierStage).toBe('RapierStage');
      expect(markProfile).toHaveBeenCalledWith('rapier-stage-start');
      expect(measureProfile).toHaveBeenCalledWith('rapier-stage-load', 'rapier-stage-start');
    });
  });

  describe('isRapierReady', () => {
    it('returns false before prefetch begins', async () => {
      const { isRapierReady } = await loadModule();
      await expect(isRapierReady()).resolves.toBe(false);
    });

    it('returns true after WASM prefetch resolves', async () => {
      const { prefetchRapier, isRapierReady } = await loadModule();
      prefetchRapier();
      await expect(isRapierReady()).resolves.toBe(true);
    });
  });

  describe('resetRapierCache', () => {
    it('clears cached promises so prefetch can restart', async () => {
      const mod = await loadModule();
      mod.prefetchRapier();
      await mod.isRapierReady();
      mod.resetRapierCache();

      await expect(mod.isRapierReady()).resolves.toBe(false);

      mod.prefetchRapier();
      await mod.isRapierReady();
      expect(markProfile).toHaveBeenCalledTimes(2);
    });
  });
});
