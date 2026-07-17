import { describe, expect, it } from 'vitest';

import { shouldStatsPanelReadyEntryPulse } from './statsPanelReadyEntryPulse.js';

describe('statsPanelReadyEntryPulse', () => {
  it('pulses only when stats toggle newly becomes actionable', () => {
    expect(shouldStatsPanelReadyEntryPulse(false, true)).toBe(true);
    expect(shouldStatsPanelReadyEntryPulse(true, true)).toBe(false);
    expect(shouldStatsPanelReadyEntryPulse(true, false)).toBe(false);
    expect(shouldStatsPanelReadyEntryPulse(false, false)).toBe(false);
  });
});
