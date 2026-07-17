import { describe, expect, it } from 'vitest';

import { shouldStakeRiskEntryPulse } from './stakeRiskEntryPulse.js';

describe('stakeRiskEntryPulse', () => {
  it('pulses only when at-risk warning becomes active', () => {
    expect(shouldStakeRiskEntryPulse(false, true)).toBe(true);
    expect(shouldStakeRiskEntryPulse(true, true)).toBe(false);
    expect(shouldStakeRiskEntryPulse(true, false)).toBe(false);
    expect(shouldStakeRiskEntryPulse(false, false)).toBe(false);
  });
});
