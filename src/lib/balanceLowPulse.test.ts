import { describe, expect, it } from 'vitest';
import { shouldBalanceLowPulse } from './balanceLowPulse.js';

describe('balanceLowPulse', () => {
  it('pulses only when low-balance warning becomes newly eligible', () => {
    expect(shouldBalanceLowPulse(false, true)).toBe(true);
    expect(shouldBalanceLowPulse(true, true)).toBe(false);
    expect(shouldBalanceLowPulse(true, false)).toBe(false);
    expect(shouldBalanceLowPulse(false, false)).toBe(false);
  });
});
