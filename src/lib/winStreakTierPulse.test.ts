import { describe, expect, it } from 'vitest';
import {
  shouldWinStreakTierPulse,
  winStreakTier,
} from './winStreakTierPulse.js';

describe('winStreakTierPulse', () => {
  it('maps streak length to HUD tiers', () => {
    expect(winStreakTier(0)).toBe('none');
    expect(winStreakTier(1)).toBe('none');
    expect(winStreakTier(2)).toBe('mild');
    expect(winStreakTier(3)).toBe('warm');
    expect(winStreakTier(4)).toBe('warm');
    expect(winStreakTier(5)).toBe('hot');
  });

  it('pulses only on upward tier transitions', () => {
    expect(shouldWinStreakTierPulse('none', 'mild')).toBe(true);
    expect(shouldWinStreakTierPulse('mild', 'warm')).toBe(true);
    expect(shouldWinStreakTierPulse('warm', 'hot')).toBe(true);
    expect(shouldWinStreakTierPulse('mild', 'mild')).toBe(false);
    expect(shouldWinStreakTierPulse('warm', 'mild')).toBe(false);
    expect(shouldWinStreakTierPulse('hot', 'none')).toBe(false);
  });
});
