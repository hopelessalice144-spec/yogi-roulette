import { describe, expect, it } from 'vitest';
import { shouldFairnessCustodyBadgeReadyPulse } from './fairnessCustodyBadgeReadyPulse.js';

describe('fairnessCustodyBadgeReadyPulse', () => {
  it('pulses only when the custody badge becomes newly actionable', () => {
    expect(shouldFairnessCustodyBadgeReadyPulse(false, true)).toBe(true);
    expect(shouldFairnessCustodyBadgeReadyPulse(true, true)).toBe(false);
    expect(shouldFairnessCustodyBadgeReadyPulse(true, false)).toBe(false);
    expect(shouldFairnessCustodyBadgeReadyPulse(false, false)).toBe(false);
  });
});
