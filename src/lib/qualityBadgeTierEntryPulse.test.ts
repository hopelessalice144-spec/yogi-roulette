import { describe, expect, it } from 'vitest';

import { shouldQualityBadgeTierEntryPulse } from './qualityBadgeTierEntryPulse.js';

describe('qualityBadgeTierEntryPulse', () => {
  it('pulses only on upward tier transitions', () => {
    expect(shouldQualityBadgeTierEntryPulse('low', 'medium')).toBe(true);
    expect(shouldQualityBadgeTierEntryPulse('medium', 'high')).toBe(true);
    expect(shouldQualityBadgeTierEntryPulse('high', 'high')).toBe(false);
    expect(shouldQualityBadgeTierEntryPulse('high', 'medium')).toBe(false);
    expect(shouldQualityBadgeTierEntryPulse('medium', 'low')).toBe(false);
  });
});
