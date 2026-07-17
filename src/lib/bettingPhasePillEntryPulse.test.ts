import { describe, expect, it } from 'vitest';

import { shouldBettingPhasePillEntryPulse } from './bettingPhasePillEntryPulse.js';

describe('bettingPhasePillEntryPulse', () => {
  it('pulses only when betting phase glow newly becomes active', () => {
    expect(shouldBettingPhasePillEntryPulse(false, true)).toBe(true);
    expect(shouldBettingPhasePillEntryPulse(true, true)).toBe(false);
    expect(shouldBettingPhasePillEntryPulse(true, false)).toBe(false);
    expect(shouldBettingPhasePillEntryPulse(false, false)).toBe(false);
  });
});
