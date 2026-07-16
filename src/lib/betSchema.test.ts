import { describe, expect, it } from 'vitest';
import {
  ALLOWED_BET_TYPES,
  CHIP_VALUES,
  MAX_BALANCE,
  MAX_BET_PER_CELL,
  MAX_TOTAL_STAKED,
  clampBalance,
  sanitizeBet,
  sanitizeBets,
  validateBetTarget,
  validateChipValue,
} from './betSchema.js';

describe('betSchema', () => {
  it('exports chip whitelist and staking ceilings', () => {
    expect(CHIP_VALUES).toEqual([1, 5, 25, 100, 500]);
    expect(MAX_BALANCE).toBe(1_000_000);
    expect(MAX_BET_PER_CELL).toBe(50_000);
    expect(MAX_TOTAL_STAKED).toBe(200_000);
    expect(ALLOWED_BET_TYPES).toContain('straight');
    expect(ALLOWED_BET_TYPES).toContain('split');
    expect(ALLOWED_BET_TYPES).toContain('line');
    expect(ALLOWED_BET_TYPES).toContain('column');
  });

  describe('validateChipValue', () => {
    it('accepts whitelisted integer chips', () => {
      for (const chip of CHIP_VALUES) {
        expect(validateChipValue(chip)).toBe(true);
      }
    });

    it('rejects fractional and off-list chips', () => {
      expect(validateChipValue(3.14)).toBe(false);
      expect(validateChipValue(10)).toBe(false);
      expect(validateChipValue(0)).toBe(false);
      expect(validateChipValue(-25)).toBe(false);
    });
  });

  describe('clampBalance', () => {
    it('clamps invalid and excessive balances', () => {
      expect(clampBalance(500)).toBe(500);
      expect(clampBalance(-10)).toBe(0);
      expect(clampBalance(Number.NaN)).toBe(0);
      expect(clampBalance(9e15)).toBe(MAX_BALANCE);
    });
  });

  describe('validateBetTarget', () => {
    it('accepts valid placement targets', () => {
      expect(validateBetTarget({ type: 'red' })).toBe(true);
      expect(validateBetTarget({ type: 'straight', value: 0 })).toBe(true);
      expect(validateBetTarget({ type: 'dozen', value: 2 })).toBe(true);
      expect(validateBetTarget({ type: 'column', value: 3 })).toBe(true);
      expect(validateBetTarget({ type: 'split', value: '1,2' })).toBe(true);
      expect(validateBetTarget({ type: 'street', value: '1,2,3' })).toBe(true);
      expect(validateBetTarget({ type: 'corner', value: '1,2,4,5' })).toBe(true);
      expect(validateBetTarget({ type: 'line', value: '1,2,3,4,5,6' })).toBe(true);
    });

    it('rejects malformed targets', () => {
      expect(validateBetTarget(null)).toBe(false);
      expect(validateBetTarget({ type: 'corner', value: 1 })).toBe(false);
      expect(validateBetTarget({ type: 'straight', value: 99 })).toBe(false);
      expect(validateBetTarget({ type: 'red', value: 1 })).toBe(false);
      expect(validateBetTarget({ type: 'dozen', value: 4 })).toBe(false);
    });
  });

  describe('sanitizeBet', () => {
    it('normalizes valid stored bets', () => {
      expect(sanitizeBet({ type: 'red', amount: 25 })).toEqual({ type: 'red', amount: 25 });
      expect(sanitizeBet({ type: 'straight', value: 7, amount: 5 })).toEqual({
        type: 'straight',
        value: 7,
        amount: 5,
      });
    });

    it('rejects tampered records', () => {
      expect(sanitizeBet({ type: 'red', amount: -5 })).toBeNull();
      expect(sanitizeBet({ type: 'red', amount: MAX_BET_PER_CELL + 1 })).toBeNull();
      expect(sanitizeBet({ type: 'unknown', amount: 10 })).toBeNull();
      expect(sanitizeBet({ type: 'straight', value: 40, amount: 5 })).toBeNull();
    });
  });

  describe('sanitizeBets', () => {
    it('filters invalid entries and caps total staked', () => {
      expect(sanitizeBets([{ type: 'red', amount: -5 }])).toEqual([]);
      expect(sanitizeBets('not-an-array' as unknown as [])).toEqual([]);

      const capped = sanitizeBets([
        { type: 'red', amount: 50_000 },
        { type: 'black', amount: 50_000 },
        { type: 'odd', amount: 50_000 },
        { type: 'even', amount: 50_000 },
        { type: 'low', amount: 50_000 },
      ]);
      expect(capped).toHaveLength(4);
      expect(capped.reduce((sum, bet) => sum + bet.amount, 0)).toBe(MAX_TOTAL_STAKED);
    });
  });
});
