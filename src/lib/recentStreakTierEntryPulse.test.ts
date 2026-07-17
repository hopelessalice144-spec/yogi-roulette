import { describe, expect, it } from 'vitest';

import { shouldRecentStreakTierEntryPulse } from './recentStreakTierEntryPulse.js';

describe('recentStreakTierEntryPulse', () => {
  it('pulses only on upward tier transitions', () => {
    expect(shouldRecentStreakTierEntryPulse('none', 'warm')).toBe(true);
    expect(shouldRecentStreakTierEntryPulse('warm', 'hot')).toBe(true);
    expect(shouldRecentStreakTierEntryPulse('warm', 'warm')).toBe(false);
    expect(shouldRecentStreakTierEntryPulse('hot', 'warm')).toBe(false);
    expect(shouldRecentStreakTierEntryPulse('hot', 'none')).toBe(false);
  });
});
