import { describe, expect, it } from 'vitest';
import { balanceSettleTone } from './balancePulse.js';

describe('balancePulse', () => {
  it('returns win or loss tone only when the player risked chips', () => {
    expect(balanceSettleTone(50, 25)).toBe('win');
    expect(balanceSettleTone(-25, 25)).toBe('loss');
    expect(balanceSettleTone(0, 25)).toBe(null);
    expect(balanceSettleTone(50, 0)).toBe(null);
  });
});
