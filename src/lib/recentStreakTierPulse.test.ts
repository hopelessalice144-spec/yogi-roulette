import { describe, expect, it } from 'vitest';
import { shouldRecentStreakTierPulse } from './recentStreakTierPulse.js';

describe('recentStreakTierPulse', () => {
  it('pulses only on upward tier transitions', () => {
    expect(shouldRecentStreakTierPulse('none', 'warm')).toBe(true);
    expect(shouldRecentStreakTierPulse('warm', 'hot')).toBe(true);
    expect(shouldRecentStreakTierPulse('warm', 'warm')).toBe(false);
    expect(shouldRecentStreakTierPulse('hot', 'warm')).toBe(false);
    expect(shouldRecentStreakTierPulse('hot', 'none')).toBe(false);
  });
});
