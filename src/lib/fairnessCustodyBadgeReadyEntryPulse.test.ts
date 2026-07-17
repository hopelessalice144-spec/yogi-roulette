import { describe, expect, it } from 'vitest';

import { shouldFairnessCustodyBadgeReadyEntryPulse } from './fairnessCustodyBadgeReadyEntryPulse.js';

describe('fairnessCustodyBadgeReadyEntryPulse', () => {
  it('pulses only when custody badge newly becomes actionable', () => {
    expect(shouldFairnessCustodyBadgeReadyEntryPulse(false, true)).toBe(true);
    expect(shouldFairnessCustodyBadgeReadyEntryPulse(true, true)).toBe(false);
    expect(shouldFairnessCustodyBadgeReadyEntryPulse(true, false)).toBe(false);
    expect(shouldFairnessCustodyBadgeReadyEntryPulse(false, false)).toBe(false);
  });
});
