import { describe, expect, it } from 'vitest';

import { shouldBalanceLowEntryPulse } from './balanceLowEntryPulse.js';

describe('balanceLowEntryPulse', () => {
  it('pulses only when balance low glow newly becomes active', () => {
    expect(shouldBalanceLowEntryPulse(false, true)).toBe(true);
    expect(shouldBalanceLowEntryPulse(true, true)).toBe(false);
    expect(shouldBalanceLowEntryPulse(true, false)).toBe(false);
    expect(shouldBalanceLowEntryPulse(false, false)).toBe(false);
  });
});
