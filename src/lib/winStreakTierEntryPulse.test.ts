import { describe, expect, it } from 'vitest';

import { shouldWinStreakTierEntryPulse } from './winStreakTierEntryPulse.js';

describe('winStreakTierEntryPulse', () => {
  it('pulses only on upward tier transitions', () => {
    expect(shouldWinStreakTierEntryPulse('none', 'mild')).toBe(true);
    expect(shouldWinStreakTierEntryPulse('mild', 'warm')).toBe(true);
    expect(shouldWinStreakTierEntryPulse('warm', 'hot')).toBe(true);
    expect(shouldWinStreakTierEntryPulse('mild', 'mild')).toBe(false);
    expect(shouldWinStreakTierEntryPulse('warm', 'mild')).toBe(false);
    expect(shouldWinStreakTierEntryPulse('hot', 'none')).toBe(false);
  });
});
