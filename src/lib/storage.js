import {
  secureLoadBalance,
  secureSaveBalance,
  secureLoadBets,
  secureSaveBets,
} from './secureStorage.js';
import { clampBalance } from './betSchema.js';

const STORAGE_KEY = 'turboRoulette.balance';
const BETS_KEY = 'turboRoulette.bets';
export const DEFAULT_BALANCE = 1000;
export const FAUCET_AMOUNT = 1000;
export const FAUCET_TRIGGER_BALANCE = 0;

export function loadBalance() {
  return secureLoadBalance(STORAGE_KEY, DEFAULT_BALANCE);
}

export function saveBalance(balance) {
  return secureSaveBalance(STORAGE_KEY, balance);
}

export function loadBets() {
  return secureLoadBets(BETS_KEY);
}

export function saveBets(bets) {
  return secureSaveBets(BETS_KEY, bets);
}

export function claimFaucet(currentBalance) {
  const balance = clampBalance(currentBalance);
  if (balance > FAUCET_TRIGGER_BALANCE) {
    return {
      claimed: false,
      amount: 0,
      balance,
      reason: 'Free refill when balance is $0',
    };
  }
  const next = clampBalance(balance + FAUCET_AMOUNT);
  saveBalance(next);
  return { claimed: true, amount: FAUCET_AMOUNT, balance: next };
}
