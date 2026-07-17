import { describe, expect, it } from 'vitest';
import { shouldPayoutToastReadyPulse } from './payoutToastReadyPulse.js';

describe('payoutToastReadyPulse', () => {
  it('pulses only when a new payout toast is added', () => {
    expect(shouldPayoutToastReadyPulse(0, 1)).toBe(true);
    expect(shouldPayoutToastReadyPulse(1, 2)).toBe(true);
    expect(shouldPayoutToastReadyPulse(2, 2)).toBe(false);
    expect(shouldPayoutToastReadyPulse(2, 1)).toBe(false);
    expect(shouldPayoutToastReadyPulse(0, 0)).toBe(false);
  });
});
