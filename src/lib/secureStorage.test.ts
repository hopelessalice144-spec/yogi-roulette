import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  secureLoadBalance,
  secureLoadBets,
  secureSaveBalance,
  secureSaveBets,
} from './secureStorage.js';

const BALANCE_KEY = 'test.secure.balance';
const BETS_KEY = 'test.secure.bets';

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

describe('secureStorage', () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('secureSaveBalance / secureLoadBalance', () => {
    it('round-trips balance with checksum wrapper', () => {
      expect(secureSaveBalance(BALANCE_KEY, 1500)).toBe(true);
      expect(secureLoadBalance(BALANCE_KEY, 0)).toBe(1500);
    });

    it('returns default when key is missing', () => {
      expect(secureLoadBalance(BALANCE_KEY, 1000)).toBe(1000);
    });

    it('rejects checksum-tampered records', () => {
      const store = mockLocalStorage();
      secureSaveBalance(BALANCE_KEY, 2000);
      const raw = store.get(BALANCE_KEY);
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw!) as { v: number; data: { balance: number }; checksum: string };
      parsed.checksum = 'deadbeef';
      store.set(BALANCE_KEY, JSON.stringify(parsed));
      expect(secureLoadBalance(BALANCE_KEY, 1000)).toBe(1000);
    });

    it('loads legacy plain numeric balance', () => {
      const store = mockLocalStorage();
      store.set(BALANCE_KEY, '750');
      expect(secureLoadBalance(BALANCE_KEY, 0)).toBe(750);
    });

    it('clamps balance on save and load', () => {
      expect(secureSaveBalance(BALANCE_KEY, 9e15)).toBe(true);
      expect(secureLoadBalance(BALANCE_KEY, 0)).toBe(1_000_000);
    });

    it('returns default when localStorage is unavailable', () => {
      vi.stubGlobal('localStorage', undefined);
      expect(secureLoadBalance(BALANCE_KEY, 1000)).toBe(1000);
      expect(secureSaveBalance(BALANCE_KEY, 500)).toBe(false);
    });
  });

  describe('secureSaveBets / secureLoadBets', () => {
    it('round-trips sanitized bets with checksum wrapper', () => {
      const bets = [{ type: 'red' as const, amount: 25 }];
      expect(secureSaveBets(BETS_KEY, bets)).toBe(true);
      expect(secureLoadBets(BETS_KEY)).toEqual(bets);
    });

    it('returns empty array when key is missing', () => {
      expect(secureLoadBets(BETS_KEY)).toEqual([]);
    });

    it('rejects checksum-tampered bet records', () => {
      const store = mockLocalStorage();
      secureSaveBets(BETS_KEY, [{ type: 'red', amount: 25 }]);
      const raw = store.get(BETS_KEY);
      const parsed = JSON.parse(raw!) as { v: number; data: { bets: unknown[] }; checksum: string };
      parsed.checksum = 'tampered';
      store.set(BETS_KEY, JSON.stringify(parsed));
      expect(secureLoadBets(BETS_KEY)).toEqual([]);
    });

    it('loads legacy plain JSON bet arrays', () => {
      const store = mockLocalStorage();
      store.set(BETS_KEY, JSON.stringify([{ type: 'black', amount: 5 }]));
      expect(secureLoadBets(BETS_KEY)).toEqual([{ type: 'black', amount: 5 }]);
    });

    it('drops invalid bets on save', () => {
      expect(secureSaveBets(BETS_KEY, [{ type: 'red', amount: -5 }])).toBe(true);
      expect(secureLoadBets(BETS_KEY)).toEqual([]);
    });
  });
});
