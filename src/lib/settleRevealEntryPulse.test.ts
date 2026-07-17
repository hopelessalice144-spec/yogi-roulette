import { describe, expect, it } from 'vitest';
import { shouldSettleRevealEntryPulse } from './settleRevealEntryPulse.js';

describe('settleRevealEntryPulse', () => {
  it('pulses only when settle-reveal becomes newly active', () => {
    expect(shouldSettleRevealEntryPulse(false, true)).toBe(true);
    expect(shouldSettleRevealEntryPulse(true, true)).toBe(false);
    expect(shouldSettleRevealEntryPulse(true, false)).toBe(false);
    expect(shouldSettleRevealEntryPulse(false, false)).toBe(false);
  });
});
