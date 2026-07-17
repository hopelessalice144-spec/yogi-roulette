import { describe, expect, it } from 'vitest';

import { shouldClearReadyEntryPulse } from './clearReadyEntryPulse.js';

describe('clearReadyEntryPulse', () => {
  it('pulses only when clear newly becomes actionable', () => {
    expect(shouldClearReadyEntryPulse(false, true)).toBe(true);
    expect(shouldClearReadyEntryPulse(true, true)).toBe(false);
    expect(shouldClearReadyEntryPulse(true, false)).toBe(false);
    expect(shouldClearReadyEntryPulse(false, false)).toBe(false);
  });
});
