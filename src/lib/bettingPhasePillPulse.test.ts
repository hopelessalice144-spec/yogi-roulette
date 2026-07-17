import { describe, expect, it } from 'vitest';
import { shouldBettingPhasePillPulse } from './bettingPhasePillPulse.js';

describe('bettingPhasePillPulse', () => {
  it('pulses only when the betting phase pill becomes newly active', () => {
    expect(shouldBettingPhasePillPulse(false, true)).toBe(true);
    expect(shouldBettingPhasePillPulse(true, true)).toBe(false);
    expect(shouldBettingPhasePillPulse(true, false)).toBe(false);
    expect(shouldBettingPhasePillPulse(false, false)).toBe(false);
  });
});
