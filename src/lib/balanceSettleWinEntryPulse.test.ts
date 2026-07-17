import { describe, expect, it } from 'vitest';

import { shouldBalanceSettleWinEntryPulse } from './balanceSettleWinEntryPulse.js';

describe('balanceSettleWinEntryPulse', () => {
  it('pulses only when balance settle key steps up with win tone', () => {
    expect(shouldBalanceSettleWinEntryPulse(0, 1, 'win')).toBe(true);
    expect(shouldBalanceSettleWinEntryPulse(1, 2, 'win')).toBe(true);
    expect(shouldBalanceSettleWinEntryPulse(0, 1, 'loss')).toBe(false);
    expect(shouldBalanceSettleWinEntryPulse(1, 1, 'win')).toBe(false);
    expect(shouldBalanceSettleWinEntryPulse(2, 1, 'win')).toBe(false);
    expect(shouldBalanceSettleWinEntryPulse(0, 1, null)).toBe(false);
  });
});
