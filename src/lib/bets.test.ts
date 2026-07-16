import { describe, expect, it } from 'vitest';
import { MAX_BET_PER_CELL } from './betSchema.js';
import { evaluateBet } from './math.js';
import { CHIP_VALUES, placeChip, settleAll, totalStaked } from './bets.js';

describe('bets', () => {
  describe('placeChip', () => {
    it('exports whitelisted chip denominations', () => {
      expect(CHIP_VALUES).toEqual([1, 5, 25, 100, 500]);
    });

    it('rejects non-whitelist and fractional chips', () => {
      expect(placeChip([], { type: 'red' }, 7.5)).toEqual([]);
      expect(placeChip([], { type: 'red' }, 10)).toEqual([]);
      expect(placeChip([], { type: 'red' }, 0)).toEqual([]);
    });

    it('places valid outside and straight bets', () => {
      const red = placeChip([], { type: 'red' }, 25);
      expect(red).toEqual([{ type: 'red', amount: 25 }]);

      const straight = placeChip([], { type: 'straight', value: 7 }, 5);
      expect(straight).toEqual([{ type: 'straight', value: 7, amount: 5 }]);
    });

    it('stacks chips on the same cell', () => {
      const first = placeChip([], { type: 'straight', value: 7 }, 5);
      const stacked = placeChip(first, { type: 'straight', value: 7 }, 25);
      expect(stacked).toHaveLength(1);
      expect(stacked[0]?.amount).toBe(30);
      expect(totalStaked(stacked)).toBe(30);
    });

    it('refuses placements that exceed per-cell max', () => {
      let bets = placeChip([], { type: 'red' }, 100);
      for (let i = 0; i < 499; i += 1) {
        bets = placeChip(bets, { type: 'red' }, 100);
      }
      expect(totalStaked(bets)).toBe(MAX_BET_PER_CELL);
      const blocked = placeChip(bets, { type: 'red' }, 100);
      expect(blocked).toBe(bets);
      expect(totalStaked(blocked)).toBe(MAX_BET_PER_CELL);
    });

    it('ignores invalid bet targets', () => {
      expect(placeChip([], { type: 'corner', value: 1 }, 25)).toEqual([]);
      expect(placeChip([], { type: 'straight', value: 99 }, 25)).toEqual([]);
    });

    it('does not mutate the input array', () => {
      const original = [{ type: 'red', amount: 5 }];
      const next = placeChip(original, { type: 'black' }, 25);
      expect(original).toHaveLength(1);
      expect(next).not.toBe(original);
    });
  });

  describe('totalStaked', () => {
    it('sums finite stake amounts', () => {
      expect(totalStaked([{ type: 'red', amount: 25 }, { type: 'odd', amount: 100 }])).toBe(125);
      expect(totalStaked([{ type: 'red', amount: Number.NaN }])).toBe(0);
    });
  });

  describe('settleAll', () => {
    it('settles winning bets via evaluateBet', () => {
      const payout = settleAll(
        [
          { type: 'straight', value: 7, amount: 5 },
          { type: 'red', amount: 50 },
        ],
        7,
        evaluateBet,
      );
      expect(payout).toBe(280);
    });

    it('returns zero for invalid winning numbers', () => {
      expect(settleAll([{ type: 'red', amount: 50 }], 99, evaluateBet)).toBe(0);
      expect(settleAll([{ type: 'red', amount: 50 }], Number.NaN, evaluateBet)).toBe(0);
    });

    it('skips tampered bet records', () => {
      const payout = settleAll(
        [
          { type: 'red', amount: 50 },
          { type: 'invalid-type', amount: 1000 },
        ],
        1,
        evaluateBet,
      );
      expect(payout).toBe(100);
    });
  });
});
