import { afterEach, describe, expect, it, vi } from 'vitest';
import { numbersForHighlight } from './highlight.js';
import {
  BLACK_NUMBERS,
  PAYOUTS,
  RED_NUMBERS,
  evaluateBet,
  getColor,
  spin,
} from './math.js';

describe('math', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getColor', () => {
    it('maps zero to green', () => {
      expect(getColor(0)).toBe('green');
    });

    it('maps red and black pockets', () => {
      expect(getColor(1)).toBe('red');
      expect(getColor(2)).toBe('black');
    });

    it('throws on invalid numbers', () => {
      expect(() => getColor(37)).toThrow(/Invalid roulette number/);
    });
  });

  describe('wheel color sets', () => {
    it('partitions 1–36 into 18 red and 18 black with no overlap', () => {
      expect(RED_NUMBERS.size).toBe(18);
      expect(BLACK_NUMBERS.size).toBe(18);
      for (let n = 1; n <= 36; n += 1) {
        expect(RED_NUMBERS.has(n) !== BLACK_NUMBERS.has(n)).toBe(true);
      }
    });
  });

  describe('PAYOUTS', () => {
    it('exposes standard european ratios', () => {
      expect(PAYOUTS.straight).toBe(35);
      expect(PAYOUTS.red).toBe(1);
      expect(PAYOUTS.dozen).toBe(2);
      expect(PAYOUTS.column).toBe(2);
    });
  });

  describe('evaluateBet', () => {
    it('returns stake plus 35:1 on winning straight bets', () => {
      expect(evaluateBet({ type: 'straight', value: 7, amount: 5 }, 7)).toBe(180);
      expect(evaluateBet({ type: 'straight', value: 7, amount: 5 }, 8)).toBe(0);
    });

    it('pays even-money outside bets', () => {
      expect(evaluateBet({ type: 'red', amount: 50 }, 1)).toBe(100);
      expect(evaluateBet({ type: 'black', amount: 50 }, 2)).toBe(100);
      expect(evaluateBet({ type: 'odd', amount: 25 }, 7)).toBe(50);
      expect(evaluateBet({ type: 'even', amount: 25 }, 8)).toBe(50);
      expect(evaluateBet({ type: 'low', amount: 10 }, 9)).toBe(20);
      expect(evaluateBet({ type: 'high', amount: 10 }, 20)).toBe(20);
    });

    it('treats zero as loss on odd/even and outside dozens', () => {
      expect(evaluateBet({ type: 'odd', amount: 10 }, 0)).toBe(0);
      expect(evaluateBet({ type: 'even', amount: 10 }, 0)).toBe(0);
      expect(evaluateBet({ type: 'dozen', value: 1, amount: 10 }, 0)).toBe(0);
    });

    it('pays dozens and columns', () => {
      expect(evaluateBet({ type: 'dozen', value: 1, amount: 12 }, 6)).toBe(36);
      expect(evaluateBet({ type: 'dozen', value: 2, amount: 12 }, 18)).toBe(36);
      expect(evaluateBet({ type: 'dozen', value: 3, amount: 12 }, 30)).toBe(36);
      expect(evaluateBet({ type: 'column', value: 1, amount: 15 }, 1)).toBe(45);
      expect(evaluateBet({ type: 'column', value: 2, amount: 15 }, 2)).toBe(45);
      expect(evaluateBet({ type: 'column', value: 3, amount: 15 }, 3)).toBe(45);
    });

    it('returns zero for invalid stake or winning number', () => {
      expect(evaluateBet({ type: 'red', amount: 0 }, 1)).toBe(0);
      expect(evaluateBet({ type: 'red', amount: -5 }, 1)).toBe(0);
      expect(evaluateBet({ type: 'red', amount: 10 }, 99)).toBe(0);
    });

    it('rejects unknown bet types', () => {
      expect(() => evaluateBet({ type: 'unknown', amount: 5 }, 7)).toThrow(/Unknown bet type/);
    });

    it('pays inside bets', () => {
      expect(evaluateBet({ type: 'split', value: '1,2', amount: 10 }, 1)).toBe(180);
      expect(evaluateBet({ type: 'split', value: '1,2', amount: 10 }, 3)).toBe(0);
      expect(evaluateBet({ type: 'street', value: '1,2,3', amount: 5 }, 2)).toBe(60);
      expect(evaluateBet({ type: 'corner', value: '1,2,4,5', amount: 4 }, 5)).toBe(36);
      expect(evaluateBet({ type: 'line', value: '1,2,3,4,5,6', amount: 6 }, 4)).toBe(36);
    });
  });

  describe('spin', () => {
    it('returns a valid pocket and matching color', () => {
      vi.spyOn(Math, 'random').mockReturnValue(7 / 37);
      const result = spin();
      expect(result.number).toBe(7);
      expect(result.color).toBe('red');
    });
  });

  describe('hover payout alignment', () => {
    it('wins red hover numbers exactly when evaluateBet red pays', () => {
      for (const n of numbersForHighlight({ type: 'red', value: null })) {
        expect(evaluateBet({ type: 'red', amount: 10 }, n)).toBe(20);
        expect(getColor(n)).toBe('red');
      }
    });

    it('wins straight hover numbers exactly when evaluateBet straight pays', () => {
      const target = 17;
      const highlighted = numbersForHighlight({ type: 'straight', value: target });
      expect(highlighted).toEqual([target]);
      expect(evaluateBet({ type: 'straight', value: target, amount: 4 }, target)).toBe(144);
    });
  });
});
