import { describe, expect, it } from 'vitest';
import {
  applyChipMagnet,
  clearCellSpotlight,
  MAGNET_RADIUS,
  resetChipMagnet,
  SPATIAL_SPRING,
  updateCellSpotlight,
} from './spatialUx.js';

type MockRect = { left: number; top: number; width: number; height: number };

function cssNum(value: string) {
  return Number.parseFloat(value);
}

function mockEl(rect: MockRect) {
  const style = new Map<string, string>();
  const dataset: Record<string, string> = {};
  return {
    style: {
      setProperty: (name: string, value: string) => style.set(name, value),
      getPropertyValue: (name: string) => style.get(name) ?? '',
    },
    dataset,
    getBoundingClientRect: () => ({
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
      x: rect.left,
      y: rect.top,
      toJSON: () => ({}),
    }),
  };
}

describe('spatialUx', () => {
  it('exports magnet radius and spring constants', () => {
    expect(MAGNET_RADIUS).toBe(35);
    expect(SPATIAL_SPRING).toBe('0.4s cubic-bezier(0.25, 1, 0.5, 1.25)');
  });

  describe('applyChipMagnet', () => {
    it('no-ops on null element', () => {
      expect(applyChipMagnet(null, 0, 0)).toBe(false);
    });

    it('resets when pointer is outside magnet radius', () => {
      const chip = mockEl({ left: 100, top: 100, width: 40, height: 40 });
      chip.dataset.magnet = '1';
      chip.style.setProperty('--chip-mx', '3px');

      expect(applyChipMagnet(chip, 200, 120)).toBe(false);
      expect(chip.style.getPropertyValue('--chip-mx')).toBe('0px');
      expect(chip.dataset.magnet).toBeUndefined();
    });

    it('resets when pointer is on chip center (dist <= 0.5)', () => {
      const chip = mockEl({ left: 100, top: 100, width: 40, height: 40 });
      chip.dataset.magnet = '1';

      expect(applyChipMagnet(chip, 120, 120)).toBe(false);
      expect(chip.style.getPropertyValue('--chip-mx')).toBe('0px');
      expect(chip.dataset.magnet).toBeUndefined();
    });

    it('applies pull transforms within radius (inactive)', () => {
      const chip = mockEl({ left: 100, top: 100, width: 40, height: 40 });
      const applied = applyChipMagnet(chip, 125, 120);

      expect(applied).toBe(true);
      expect(chip.dataset.magnet).toBe('1');
      expect(cssNum(chip.style.getPropertyValue('--chip-mx'))).toBeCloseTo(2.228571, 5);
      expect(cssNum(chip.style.getPropertyValue('--chip-my'))).toBe(0);
      expect(cssNum(chip.style.getPropertyValue('--chip-rot'))).toBeCloseTo(0.78, 2);
      expect(cssNum(chip.style.getPropertyValue('--chip-scale'))).toBeCloseTo(1.102857, 5);
      expect(cssNum(chip.style.getPropertyValue('--chip-lift'))).toBeCloseTo(-3.428571, 5);
    });

    it('uses stronger pull when chip is active', () => {
      const chip = mockEl({ left: 100, top: 100, width: 40, height: 40 });
      applyChipMagnet(chip, 125, 120, true);

      expect(cssNum(chip.style.getPropertyValue('--chip-mx'))).toBeCloseTo(2.657143, 5);
    });
  });

  describe('resetChipMagnet', () => {
    it('no-ops on null element', () => {
      expect(() => resetChipMagnet(null)).not.toThrow();
    });

    it('clears magnet CSS vars and dataset flag', () => {
      const chip = mockEl({ left: 0, top: 0, width: 20, height: 20 });
      chip.dataset.magnet = '1';
      chip.style.setProperty('--chip-mx', '4px');
      chip.style.setProperty('--chip-my', '-2px');
      chip.style.setProperty('--chip-rot', '3deg');
      chip.style.setProperty('--chip-scale', '1.1');
      chip.style.setProperty('--chip-lift', '-3px');

      resetChipMagnet(chip);

      expect(chip.style.getPropertyValue('--chip-mx')).toBe('0px');
      expect(chip.style.getPropertyValue('--chip-my')).toBe('0px');
      expect(chip.style.getPropertyValue('--chip-rot')).toBe('0deg');
      expect(chip.style.getPropertyValue('--chip-scale')).toBe('1');
      expect(chip.style.getPropertyValue('--chip-lift')).toBe('0px');
      expect(chip.dataset.magnet).toBeUndefined();
    });
  });

  describe('updateCellSpotlight', () => {
    it('no-ops on null element', () => {
      expect(() => updateCellSpotlight(null, 50, 50)).not.toThrow();
    });

    it('no-ops on zero-size cells', () => {
      const cell = mockEl({ left: 0, top: 0, width: 0, height: 50 });
      updateCellSpotlight(cell, 10, 10);
      expect(cell.dataset.spotlit).toBeUndefined();
    });

    it('maps pointer position to percentage spotlight coords', () => {
      const cell = mockEl({ left: 0, top: 0, width: 100, height: 50 });
      updateCellSpotlight(cell, 25, 10);

      expect(cell.dataset.spotlit).toBe('1');
      expect(cell.style.getPropertyValue('--spot-x')).toBe('25%');
      expect(cell.style.getPropertyValue('--spot-y')).toBe('20%');
    });
  });

  describe('clearCellSpotlight', () => {
    it('no-ops on null element', () => {
      expect(() => clearCellSpotlight(null)).not.toThrow();
    });

    it('resets spotlight to center and clears dataset flag', () => {
      const cell = mockEl({ left: 0, top: 0, width: 100, height: 100 });
      cell.dataset.spotlit = '1';
      cell.style.setProperty('--spot-x', '10%');
      cell.style.setProperty('--spot-y', '80%');

      clearCellSpotlight(cell);

      expect(cell.style.getPropertyValue('--spot-x')).toBe('50%');
      expect(cell.style.getPropertyValue('--spot-y')).toBe('50%');
      expect(cell.dataset.spotlit).toBeUndefined();
    });
  });
});
