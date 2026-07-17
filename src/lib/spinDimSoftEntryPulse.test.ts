import { describe, expect, it } from 'vitest';
import { shouldSpinDimSoftEntryPulse } from './spinDimSoftEntryPulse.js';

describe('spinDimSoftEntryPulse', () => {
  it('pulses only when soft spin dim becomes newly active', () => {
    expect(shouldSpinDimSoftEntryPulse(false, true)).toBe(true);
    expect(shouldSpinDimSoftEntryPulse(true, true)).toBe(false);
    expect(shouldSpinDimSoftEntryPulse(true, false)).toBe(false);
    expect(shouldSpinDimSoftEntryPulse(false, false)).toBe(false);
  });
});
