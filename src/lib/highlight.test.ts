import { describe, expect, it } from 'vitest';
import { EUROPEAN_SEQUENCE } from './wheel.js';
import {
  boardHighlightSet,
  columnForNumber,
  dividerIndicesForHighlight,
  isOutsideSource,
  isStraightPathwayLit,
  numbersForHighlight,
  neonGlowColorForHighlight,
  pocketIndicesForHighlight,
  rowForNumber,
  samplePocketIndices,
  warmGlowColorForHighlight,
} from './highlight.js';

describe('highlight', () => {
  describe('numbersForHighlight', () => {
    it('returns empty for missing type', () => {
      expect(numbersForHighlight({ type: undefined, value: undefined })).toEqual([]);
    });

    it('maps straight bets to a single number', () => {
      expect(numbersForHighlight({ type: 'straight', value: 7 })).toEqual([7]);
    });

    it('maps outside bets to the expected counts', () => {
      expect(numbersForHighlight({ type: 'red', value: undefined })).toHaveLength(18);
      expect(numbersForHighlight({ type: 'black', value: undefined })).toHaveLength(18);
      expect(numbersForHighlight({ type: 'odd', value: undefined })).toHaveLength(18);
      expect(numbersForHighlight({ type: 'even', value: undefined })).toHaveLength(18);
      expect(numbersForHighlight({ type: 'low', value: undefined })).toEqual(
        Array.from({ length: 18 }, (_, i) => i + 1),
      );
      expect(numbersForHighlight({ type: 'high', value: undefined })).toEqual(
        Array.from({ length: 18 }, (_, i) => i + 19),
      );
    });

    it('maps dozens and columns', () => {
      expect(numbersForHighlight({ type: 'dozen', value: 2 })).toEqual(
        Array.from({ length: 12 }, (_, i) => i + 13),
      );
      expect(numbersForHighlight({ type: 'column', value: 3 })).toEqual(
        Array.from({ length: 12 }, (_, i) => i * 3 + 3),
      );
    });

    it('maps inside bets to covered pockets', () => {
      expect(numbersForHighlight({ type: 'split', value: '1,2' })).toEqual([1, 2]);
      expect(numbersForHighlight({ type: 'street', value: '1,2,3' })).toEqual([1, 2, 3]);
      expect(numbersForHighlight({ type: 'corner', value: '1,2,4,5' })).toEqual([1, 2, 4, 5]);
      expect(numbersForHighlight({ type: 'line', value: '1,2,3,4,5,6' })).toEqual([
        1, 2, 3, 4, 5, 6,
      ]);
    });

    it('maps wheel-set highlights from racetrack hover', () => {
      expect(numbersForHighlight({ type: 'wheel-set', value: '7,8,9' })).toEqual([7, 8, 9]);
    });
  });

  describe('pocketIndicesForHighlight', () => {
    it('resolves straight hover to a single wheel pocket index', () => {
      const pockets = pocketIndicesForHighlight({ type: 'straight', value: 7 });
      expect(pockets.size).toBe(1);
      expect(pockets.has(EUROPEAN_SEQUENCE.indexOf(7))).toBe(true);
    });

    it('returns empty when highlight type is missing', () => {
      expect(pocketIndicesForHighlight(null)).toEqual(new Set());
    });
  });

  describe('dividerIndicesForHighlight', () => {
    it('flanks straight pockets with neighboring divider pins', () => {
      const pocketIdx = EUROPEAN_SEQUENCE.indexOf(7);
      const dividers = dividerIndicesForHighlight({ type: 'straight', value: 7 });
      expect(dividers.size).toBeGreaterThanOrEqual(2);
      expect(dividers.has(pocketIdx)).toBe(true);
      expect(dividers.has((pocketIdx + 36) % 37)).toBe(true);
      expect(dividers.has((pocketIdx + 1) % 37)).toBe(true);
    });
  });

  describe('board helpers', () => {
    it('builds board highlight sets from hover payloads', () => {
      const set = boardHighlightSet({ type: 'straight', value: 12 });
      expect(set).toEqual(new Set([12]));
    });

    it('lights straight pathways and outside sources correctly', () => {
      expect(isStraightPathwayLit(7, { type: 'straight', value: 7 })).toBe(true);
      expect(isStraightPathwayLit(8, { type: 'straight', value: 7 })).toBe(false);
      expect(isStraightPathwayLit(14, { type: 'red' })).toBe(true);
      expect(
        isOutsideSource({ type: 'dozen', value: 2 }, { type: 'dozen', value: 2 }),
      ).toBe(true);
      expect(
        isOutsideSource({ type: 'dozen', value: 1 }, { type: 'dozen', value: 2 }),
      ).toBe(false);
    });
  });

  describe('layout helpers', () => {
    it('maps numbers to board column and row indices', () => {
      expect(columnForNumber(0)).toBe(0);
      expect(columnForNumber(1)).toBe(1);
      expect(columnForNumber(2)).toBe(2);
      expect(columnForNumber(3)).toBe(3);
      expect(rowForNumber(0)).toBe(-1);
      expect(rowForNumber(3)).toBe(0);
      expect(rowForNumber(36)).toBe(11);
    });
  });

  describe('warmGlowColorForHighlight', () => {
    it('returns bet-type tint presets', () => {
      expect(warmGlowColorForHighlight({ type: 'red' })).toBe('#ff5544');
      expect(warmGlowColorForHighlight({ type: 'black' })).toBe('#88aaff');
      expect(warmGlowColorForHighlight({ type: 'straight', value: 0 })).toBe('#44ffbb');
      expect(warmGlowColorForHighlight({ type: 'straight', value: 7 })).toBe('#ffcc66');
      expect(warmGlowColorForHighlight({ type: 'wheel-set', value: '7,8,9' })).toBe('#f5d78e');
      expect(warmGlowColorForHighlight(null)).toBe('#ffaa44');
    });
  });

  describe('neonGlowColorForHighlight', () => {
    it('returns lounge and neon tint presets', () => {
      expect(neonGlowColorForHighlight({ type: 'red' }, 'lounge')).toBe('#ff5544');
      expect(neonGlowColorForHighlight({ type: 'red' }, 'neon')).toBe('#ff2d95');
      expect(neonGlowColorForHighlight({ type: 'red' }, 'light')).toBe('#c62828');
      expect(neonGlowColorForHighlight({ type: 'wheel-set', value: '7,8,9' }, 'neon')).toBe(
        '#00ffff',
      );
      expect(neonGlowColorForHighlight(null, 'neon')).toBe('#ff7ec8');
      expect(neonGlowColorForHighlight(null, 'light')).toBe('#c9a227');
    });
  });

  describe('samplePocketIndices', () => {
    it('caps large pocket sets while preserving order', () => {
      const all = new Set([0, 5, 10, 15, 20, 25, 30]);
      expect(samplePocketIndices(all, 3)).toEqual([0, 10, 20]);
      expect(samplePocketIndices(all, 10)).toEqual([0, 5, 10, 15, 20, 25, 30]);
    });
  });
});
