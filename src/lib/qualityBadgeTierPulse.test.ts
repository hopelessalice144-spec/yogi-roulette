import { describe, expect, it } from 'vitest';
import { shouldQualityBadgeTierPulse } from './qualityBadgeTierPulse.js';

describe('qualityBadgeTierPulse', () => {
  it('pulses only on upward tier transitions', () => {
    expect(shouldQualityBadgeTierPulse('low', 'medium')).toBe(true);
    expect(shouldQualityBadgeTierPulse('medium', 'high')).toBe(true);
    expect(shouldQualityBadgeTierPulse('high', 'high')).toBe(false);
    expect(shouldQualityBadgeTierPulse('high', 'medium')).toBe(false);
    expect(shouldQualityBadgeTierPulse('medium', 'low')).toBe(false);
  });
});
