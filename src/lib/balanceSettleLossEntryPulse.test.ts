import { describe, expect, it } from 'vitest';

import { shouldBalanceSettleLossEntryPulse } from './balanceSettleLossEntryPulse.js';

describe('balanceSettleLossEntryPulse', () => {
  it('pulses only when balance settle key steps up with loss tone', () => {
    expect(shouldBalanceSettleLossEntryPulse(0, 1, 'loss')).toBe(true);
    expect(shouldBalanceSettleLossEntryPulse(1, 2, 'loss')).toBe(true);
    expect(shouldBalanceSettleLossEntryPulse(0, 1, 'win')).toBe(false);
    expect(shouldBalanceSettleLossEntryPulse(1, 1, 'loss')).toBe(false);
    expect(shouldBalanceSettleLossEntryPulse(2, 1, 'loss')).toBe(false);
    expect(shouldBalanceSettleLossEntryPulse(0, 1, null)).toBe(false);
  });
});
