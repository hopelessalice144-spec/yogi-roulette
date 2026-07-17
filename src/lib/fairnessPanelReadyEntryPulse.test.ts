import { describe, expect, it } from 'vitest';

import { shouldFairnessPanelReadyEntryPulse } from './fairnessPanelReadyEntryPulse.js';

describe('fairnessPanelReadyEntryPulse', () => {
  it('pulses only when fairness toggle newly becomes actionable', () => {
    expect(shouldFairnessPanelReadyEntryPulse(false, true)).toBe(true);
    expect(shouldFairnessPanelReadyEntryPulse(true, true)).toBe(false);
    expect(shouldFairnessPanelReadyEntryPulse(true, false)).toBe(false);
    expect(shouldFairnessPanelReadyEntryPulse(false, false)).toBe(false);
  });
});
