import { describe, expect, it } from 'vitest';
import { shouldSpinPhasePillPulse } from './spinPhasePillPulse.js';

describe('spinPhasePillPulse', () => {
  it('pulses only when the spin phase pill becomes newly active', () => {
    expect(shouldSpinPhasePillPulse(false, true)).toBe(true);
    expect(shouldSpinPhasePillPulse(true, true)).toBe(false);
    expect(shouldSpinPhasePillPulse(true, false)).toBe(false);
    expect(shouldSpinPhasePillPulse(false, false)).toBe(false);
  });
});
