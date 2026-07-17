import { describe, expect, it } from 'vitest';
import { minChipBet, shouldBalanceLowGlow } from './balanceLowGlow.js';

describe('balanceLowGlow', () => {
  const chips = [1, 5, 25, 100, 500];

  it('resolves minimum chip bet from rack values', () => {
    expect(minChipBet(chips)).toBe(1);
    expect(minChipBet([5, 25])).toBe(5);
    expect(minChipBet([])).toBe(1);
  });

  it('glows only when balance is below the minimum bet', () => {
    expect(shouldBalanceLowGlow(0, chips)).toBe(true);
    expect(shouldBalanceLowGlow(1, chips)).toBe(false);
    expect(shouldBalanceLowGlow(500, chips)).toBe(false);
  });

  it('suppresses glow during security hold', () => {
    expect(shouldBalanceLowGlow(0, chips, { securityFrozen: true })).toBe(false);
  });
});
