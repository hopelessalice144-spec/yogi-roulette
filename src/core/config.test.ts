import { describe, expect, it } from 'vitest';
import APP_CONFIG, { APP_CONFIG as namedConfig } from './config.js';

describe('config', () => {
  it('exports frozen APP_CONFIG with european wheel geometry', () => {
    expect(namedConfig.variant).toBe('european');
    expect(namedConfig.pockets).toBe(37);
    expect(namedConfig.name).toBe('Yogi Roulette');
    expect(namedConfig.version).toBe('3.0.0');
  });

  it('default export matches named APP_CONFIG', () => {
    expect(APP_CONFIG).toBe(namedConfig);
  });

  describe('cycle', () => {
    it('keeps monotonic phase boundaries inside the 30s window', () => {
      const { cycle } = namedConfig;
      expect(cycle.seconds).toBe(30);
      expect(cycle.bettingEnd).toBeLessThan(cycle.lockEnd);
      expect(cycle.lockEnd).toBeLessThanOrEqual(cycle.spinEnd);
      expect(cycle.spinEnd).toBe(cycle.seconds);
    });
  });

  describe('physics', () => {
    it('targets 60fps with matching fixed timestep', () => {
      const { physics } = namedConfig;
      expect(physics.targetFps).toBe(60);
      expect(physics.fixedTimestep).toBeCloseTo(1 / 60, 6);
      expect(physics.maxSubSteps).toBeGreaterThan(0);
    });
  });

  describe('wallet', () => {
    it('enforces sane faucet and staking ceilings', () => {
      const { wallet } = namedConfig;
      expect(wallet.faucetAmount).toBeGreaterThan(0);
      expect(wallet.maxBetPerCell).toBeLessThanOrEqual(wallet.maxTotalStaked);
      expect(wallet.maxTotalStaked).toBeLessThanOrEqual(wallet.maxBalance);
    });
  });

  describe('provablyFair', () => {
    it('enables hmac-sha256-mod37 with digest prefix', () => {
      const { provablyFair } = namedConfig;
      expect(provablyFair.enabled).toBe(true);
      expect(provablyFair.algorithm).toBe('hmac-sha256-mod37');
      expect(provablyFair.digestPrefixHexChars).toBe(8);
    });
  });

  describe('performance', () => {
    it('orders fps watchdog thresholds', () => {
      const { performance } = namedConfig;
      expect(performance.pausePhysicsBelowFps).toBeLessThan(performance.lowFpsThreshold);
    });
  });

  describe('hud', () => {
    it('meets minimum touch target and spin-focus tuning', () => {
      const { hud } = namedConfig;
      expect(hud.touchTargetPx).toBeGreaterThanOrEqual(44);
      expect(hud.spinFocusScale).toBeGreaterThan(0);
      expect(hud.spinFocusScale).toBeLessThanOrEqual(1);
      expect(hud.spinFocusOpacity).toBeGreaterThanOrEqual(0);
      expect(hud.spinFocusOpacity).toBeLessThanOrEqual(1);
    });
  });
});
