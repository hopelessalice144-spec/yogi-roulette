import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  claimFaucet,
  DEFAULT_BALANCE,
  FAUCET_AMOUNT,
  FAUCET_TRIGGER_BALANCE,
  loadBalance,
  loadBets,
  saveBalance,
  saveBets,
} from './storage.js';

function mockLocalStorage(): Map<string, string> {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  });
  return store;
}

describe('storage', () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('exports faucet and default balance constants', () => {
    expect(DEFAULT_BALANCE).toBe(1000);
    expect(FAUCET_AMOUNT).toBe(1000);
    expect(FAUCET_TRIGGER_BALANCE).toBe(0);
  });

  describe('loadBalance / saveBalance', () => {
    it('returns default balance when storage is empty', () => {
      expect(loadBalance()).toBe(DEFAULT_BALANCE);
    });

    it('round-trips balance through secure storage keys', () => {
      expect(saveBalance(2500)).toBe(true);
      expect(loadBalance()).toBe(2500);
    });
  });

  describe('loadBets / saveBets', () => {
    it('returns empty bets when storage is empty', () => {
      expect(loadBets()).toEqual([]);
    });

    it('round-trips sanitized bets through secure storage keys', () => {
      const bets = [{ type: 'red' as const, amount: 25 }];
      expect(saveBets(bets)).toBe(true);
      expect(loadBets()).toEqual(bets);
    });
  });

  describe('claimFaucet', () => {
    it('refuses refill when balance is above trigger', () => {
      const result = claimFaucet(500);
      expect(result).toEqual({
        claimed: false,
        amount: 0,
        balance: 500,
        reason: 'Free refill when balance is $0',
      });
      expect(loadBalance()).toBe(DEFAULT_BALANCE);
    });

    it('grants faucet at zero balance and persists', () => {
      saveBalance(0);
      const result = claimFaucet(0);
      expect(result).toEqual({
        claimed: true,
        amount: FAUCET_AMOUNT,
        balance: FAUCET_AMOUNT,
      });
      expect(loadBalance()).toBe(FAUCET_AMOUNT);
    });

    it('grants faucet for negative input after clamping', () => {
      const result = claimFaucet(-50);
      expect(result.claimed).toBe(true);
      expect(result.amount).toBe(FAUCET_AMOUNT);
      expect(result.balance).toBe(FAUCET_AMOUNT);
      expect(loadBalance()).toBe(FAUCET_AMOUNT);
    });
  });
});
