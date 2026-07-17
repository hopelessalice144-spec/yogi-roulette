import { describe, expect, it } from 'vitest';

import { shouldSpinPhasePillEntryPulse } from './spinPhasePillEntryPulse.js';

describe('spinPhasePillEntryPulse', () => {
  it('pulses only when spin phase glow newly becomes active', () => {
    expect(shouldSpinPhasePillEntryPulse(false, true)).toBe(true);
    expect(shouldSpinPhasePillEntryPulse(true, true)).toBe(false);
    expect(shouldSpinPhasePillEntryPulse(true, false)).toBe(false);
    expect(shouldSpinPhasePillEntryPulse(false, false)).toBe(false);
  });
});
