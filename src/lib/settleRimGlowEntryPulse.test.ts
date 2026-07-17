import { describe, expect, it } from 'vitest';
import { shouldSettleRimGlowEntryPulse } from './settleRimGlowEntryPulse.js';

describe('settleRimGlowEntryPulse', () => {
  it('pulses only when settle rim glow becomes newly active', () => {
    expect(shouldSettleRimGlowEntryPulse(false, true)).toBe(true);
    expect(shouldSettleRimGlowEntryPulse(true, true)).toBe(false);
    expect(shouldSettleRimGlowEntryPulse(true, false)).toBe(false);
    expect(shouldSettleRimGlowEntryPulse(false, false)).toBe(false);
  });
});
