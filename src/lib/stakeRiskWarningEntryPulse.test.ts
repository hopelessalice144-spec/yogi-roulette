import { describe, expect, it } from 'vitest';
import { shouldStakeRiskWarningEntryPulse } from './stakeRiskWarningEntryPulse.js';

describe('stakeRiskWarningEntryPulse', () => {
  it('pulses only when stake risk warning becomes newly active', () => {
    expect(shouldStakeRiskWarningEntryPulse(false, true)).toBe(true);
    expect(shouldStakeRiskWarningEntryPulse(true, true)).toBe(false);
    expect(shouldStakeRiskWarningEntryPulse(true, false)).toBe(false);
    expect(shouldStakeRiskWarningEntryPulse(false, false)).toBe(false);
  });
});
