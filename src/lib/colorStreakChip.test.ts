import { describe, expect, it } from 'vitest';
import {
  HOT_COLOR_STREAK,
  MIN_COLOR_STREAK_HIGHLIGHT,
  colorStreakRun,
  colorStreakTier,
  isColorStreakChip,
} from './colorStreakChip.js';

describe('colorStreakChip', () => {
  it('tiers color runs by length', () => {
    expect(colorStreakTier(2)).toBe('none');
    expect(colorStreakTier(MIN_COLOR_STREAK_HIGHLIGHT)).toBe('warm');
    expect(colorStreakTier(HOT_COLOR_STREAK)).toBe('hot');
  });

  it('builds highlight metadata for active runs', () => {
    const run = colorStreakRun([
      { color: 'red' },
      { color: 'red' },
      { color: 'red' },
      { color: 'black' },
    ]);
    expect(run).toEqual({
      color: 'red',
      length: 3,
      tier: 'warm',
      highlightCount: 3,
    });
    expect(isColorStreakChip(0, run)).toBe(true);
    expect(isColorStreakChip(2, run)).toBe(true);
    expect(isColorStreakChip(3, run)).toBe(false);
  });

  it('flags hot runs at five or more', () => {
    const run = colorStreakRun(
      Array.from({ length: 5 }, () => ({ color: 'black' })),
    );
    expect(run.tier).toBe('hot');
    expect(run.highlightCount).toBe(5);
  });
});
