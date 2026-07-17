import { describe, expect, it } from 'vitest';
import { shouldBalanceSettleEntryPulse } from './balanceSettleEntryPulse.js';

describe('balanceSettleEntryPulse', () => {
  it('pulses only when balance settle tone newly activates', () => {
    expect(shouldBalanceSettleEntryPulse(0, 1, 'win')).toBe(true);
    expect(shouldBalanceSettleEntryPulse(1, 2, 'loss')).toBe(true);
    expect(shouldBalanceSettleEntryPulse(1, 1, 'win')).toBe(false);
    expect(shouldBalanceSettleEntryPulse(0, 1, null)).toBe(false);
    expect(shouldBalanceSettleEntryPulse(2, 1, 'win')).toBe(false);
  });
});
