import { describe, expect, it } from 'vitest';
import { CHIP_VALUES } from './bets.js';
import { chipsFromAmount, visibleChipStack } from './chipVisual.js';

describe('chipVisual', () => {
  describe('chipsFromAmount', () => {
    it('returns empty breakdown for non-positive amounts', () => {
      expect(chipsFromAmount(0)).toEqual([]);
      expect(chipsFromAmount(-10)).toEqual([]);
      expect(chipsFromAmount(undefined as unknown as number)).toEqual([]);
    });

    it('greedily decomposes into largest denominations first', () => {
      expect(chipsFromAmount(30)).toEqual([25, 5]);
      expect(chipsFromAmount(130)).toEqual([100, 25, 5]);
    });

    it('caps visual chips at eight layers', () => {
      expect(chipsFromAmount(9, [1])).toEqual([1, 1, 1, 1, 1, 1, 1, 1]);
      expect(chipsFromAmount(10, [1])).toEqual([1, 1, 1, 1, 1, 1, 1, 1]);
    });

    it('supports custom denomination lists', () => {
      expect(chipsFromAmount(12, [10, 3, 1])).toEqual([10, 1, 1]);
    });
  });

  describe('visibleChipStack', () => {
    it('returns all layers when within the cap', () => {
      expect(visibleChipStack(30)).toEqual({ layers: [25, 5], overflow: 0 });
    });

    it('truncates layers and reports overflow beyond maxLayers', () => {
      const stack = visibleChipStack(24, 5);
      expect(stack.layers).toEqual([5, 5, 5, 5, 1]);
      expect(stack.overflow).toBe(3);
    });

    it('defaults to five visible layers', () => {
      const stack = visibleChipStack(24);
      expect(stack.layers).toHaveLength(5);
      expect(stack.overflow).toBe(3);
    });

    it('uses standard chip denominations from bets', () => {
      expect(chipsFromAmount(5)).toEqual([5]);
      expect(CHIP_VALUES).toContain(5);
    });
  });
});
