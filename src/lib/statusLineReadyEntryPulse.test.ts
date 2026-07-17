import { describe, expect, it } from 'vitest';

import { shouldStatusLineReadyEntryPulse } from './statusLineReadyEntryPulse.js';

describe('statusLineReadyEntryPulse', () => {
  it('pulses only when status line newly becomes actionable', () => {
    expect(shouldStatusLineReadyEntryPulse(false, true)).toBe(true);
    expect(shouldStatusLineReadyEntryPulse(true, true)).toBe(false);
    expect(shouldStatusLineReadyEntryPulse(true, false)).toBe(false);
    expect(shouldStatusLineReadyEntryPulse(false, false)).toBe(false);
  });
});
