import { describe, expect, it } from 'vitest';

import { shouldResultPillReadyEntryPulse } from './resultPillReadyEntryPulse.js';

describe('resultPillReadyEntryPulse', () => {
  it('pulses only when result pill newly becomes actionable', () => {
    expect(shouldResultPillReadyEntryPulse(false, true)).toBe(true);
    expect(shouldResultPillReadyEntryPulse(true, true)).toBe(false);
    expect(shouldResultPillReadyEntryPulse(true, false)).toBe(false);
    expect(shouldResultPillReadyEntryPulse(false, false)).toBe(false);
  });
});
