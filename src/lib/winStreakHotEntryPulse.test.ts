import { describe, expect, it } from 'vitest';
import { shouldWinStreakHotEntryPulse } from './winStreakHotEntryPulse.js';

describe('winStreakHotEntryPulse', () => {
  it('pulses only when win streak tier newly enters hot', () => {
    expect(shouldWinStreakHotEntryPulse('warm', 'hot')).toBe(true);
    expect(shouldWinStreakHotEntryPulse('mild', 'hot')).toBe(false);
    expect(shouldWinStreakHotEntryPulse('hot', 'hot')).toBe(false);
    expect(shouldWinStreakHotEntryPulse('hot', 'warm')).toBe(false);
    expect(shouldWinStreakHotEntryPulse('none', 'mild')).toBe(false);
  });
});
