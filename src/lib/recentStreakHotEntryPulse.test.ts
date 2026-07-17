import { describe, expect, it } from 'vitest';
import { shouldRecentStreakHotEntryPulse } from './recentStreakHotEntryPulse.js';

describe('recentStreakHotEntryPulse', () => {
  it('pulses only when recent streak tier newly enters hot', () => {
    expect(shouldRecentStreakHotEntryPulse('warm', 'hot')).toBe(true);
    expect(shouldRecentStreakHotEntryPulse('none', 'hot')).toBe(false);
    expect(shouldRecentStreakHotEntryPulse('hot', 'hot')).toBe(false);
    expect(shouldRecentStreakHotEntryPulse('hot', 'warm')).toBe(false);
    expect(shouldRecentStreakHotEntryPulse('none', 'warm')).toBe(false);
  });
});
