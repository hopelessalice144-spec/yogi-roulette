import { describe, expect, it } from 'vitest';
import {
  BOWL_METAL,
  dampFactor,
  easeInOutCubic,
  easeOutCubic,
  LUXURY_GOLD,
  MAHOGANY_LACQUER,
  NEON_RING,
  PLINTH_METAL,
  POCKET_FELT,
  POLISHED_IVORY_CHROME,
  SPINDLE_APEX,
  springStep,
  TABLE_FELT,
} from './materials.js';

describe('materials', () => {
  describe('VIP PBR presets', () => {
    it('keeps mahogany lacquer glossy with sheen and iridescence', () => {
      expect(MAHOGANY_LACQUER.clearcoat).toBe(1);
      expect(MAHOGANY_LACQUER.sheen).toBeGreaterThan(0.3);
      expect(MAHOGANY_LACQUER.iridescence).toBeGreaterThan(0);
      expect(MAHOGANY_LACQUER.color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('defines bullion metals with near-full metalness', () => {
      expect(LUXURY_GOLD.metalness).toBeGreaterThan(0.98);
      expect(LUXURY_GOLD.anisotropy).toBeGreaterThan(0.4);
      expect(SPINDLE_APEX.metalness).toBeGreaterThan(0.98);
      expect(SPINDLE_APEX.envMapIntensity).toBe(2);
    });

    it('exposes polished ivory chrome for ball SSS base', () => {
      expect(POLISHED_IVORY_CHROME.color).toBe('#f6f2ea');
      expect(POLISHED_IVORY_CHROME.metalness).toBeLessThan(0.3);
      expect(POLISHED_IVORY_CHROME.roughness).toBeGreaterThan(0.04);
    });

    it('maps pocket felt variants for red, black, and green', () => {
      expect(POCKET_FELT.red.color).toBe('#8a1220');
      expect(POCKET_FELT.black.color).toBe('#06060c');
      expect(POCKET_FELT.green.color).toBe('#0a5238');
      for (const felt of Object.values(POCKET_FELT)) {
        expect(felt.clearcoat).toBeGreaterThan(0.5);
        expect(felt.envMapIntensity).toBeLessThan(1);
      }
    });

    it('defines structural metals and table felt', () => {
      expect(BOWL_METAL.metalness).toBeGreaterThan(0.8);
      expect(PLINTH_METAL.metalness).toBeGreaterThan(0.75);
      expect(TABLE_FELT.roughness).toBeGreaterThan(0.6);
      expect(TABLE_FELT.metalness).toBeLessThan(0.1);
    });

    it('keeps neon ring emissive and untone-mapped', () => {
      expect(NEON_RING.emissive).toBe(NEON_RING.color);
      expect(NEON_RING.toneMapped).toBe(false);
      expect(NEON_RING.transparent).toBe(true);
      expect(NEON_RING.opacity).toBeCloseTo(0.9, 5);
    });
  });

  describe('kinematic helpers', () => {
    it('computes dampFactor from lambda and delta', () => {
      expect(dampFactor(5, 0)).toBe(0);
      const step = dampFactor(8, 0.016);
      expect(step).toBeGreaterThan(0);
      expect(step).toBeLessThan(1);
    });

    it('eases cubic curves through endpoints', () => {
      expect(easeOutCubic(0)).toBe(0);
      expect(easeOutCubic(1)).toBe(1);
      expect(easeOutCubic(0.5)).toBeCloseTo(0.875, 5);

      expect(easeInOutCubic(0)).toBe(0);
      expect(easeInOutCubic(1)).toBe(1);
      expect(easeInOutCubic(0.25)).toBeCloseTo(0.0625, 5);
      expect(easeInOutCubic(0.75)).toBeCloseTo(0.9375, 5);
    });

    it('steps a spring toward its target', () => {
      let pos = 0;
      let vel = 0;
      for (let i = 0; i < 120; i++) {
        [pos, vel] = springStep(pos, 1, vel, 180, 24, 1 / 60);
      }
      expect(pos).toBeGreaterThan(0.9);
      expect(Math.abs(vel)).toBeLessThan(0.2);
    });
  });
});
