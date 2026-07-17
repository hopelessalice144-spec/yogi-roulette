import { describe, expect, it } from 'vitest';
import { repeatRoundWallet } from './lastRoundBets.js';

describe('lastRoundBets', () => {
  it('replaces the board and refunds current stakes', () => {
    const result = repeatRoundWallet(
      500,
      [{ type: 'red', amount: 25 }],
      [{ type: 'straight', value: 7, amount: 50 }],
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.nextBalance).toBe(475);
    expect(result.bets).toEqual([{ type: 'straight', value: 7, amount: 50 }]);
  });

  it('rejects repeat when balance is insufficient', () => {
    const result = repeatRoundWallet(40, [], [{ type: 'red', amount: 100 }]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('balance');
  });

  it('rejects empty snapshots', () => {
    expect(repeatRoundWallet(1000, [], []).ok).toBe(false);
  });
});
