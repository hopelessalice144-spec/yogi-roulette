/**
 * Last-round bet layout — capture on settle, one-tap repeat on next betting phase.
 */

import { clampBalance, MAX_TOTAL_STAKED, sanitizeBets } from './betSchema.js';
import { totalStaked } from './bets.js';

const STORAGE_KEY = 'turboRoulette.lastRoundBets';

export function loadLastRoundBets() {
  if (typeof sessionStorage === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return sanitizeBets(parsed);
  } catch {
    return [];
  }
}

export function saveLastRoundBets(bets) {
  if (typeof sessionStorage === 'undefined') return [];
  const safe = sanitizeBets(bets);
  try {
    if (!safe.length) {
      sessionStorage.removeItem(STORAGE_KEY);
      return [];
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
    return safe;
  } catch {
    return safe;
  }
}

export function repeatRoundWallet(currentBalance, currentBets, snapshot) {
  const layout = sanitizeBets(snapshot);
  if (!layout.length) {
    return { ok: false, reason: 'empty' };
  }

  const cost = totalStaked(layout);
  if (cost > MAX_TOTAL_STAKED) {
    return { ok: false, reason: 'limit' };
  }

  const refund = totalStaked(sanitizeBets(currentBets));
  const nextBalance = currentBalance + refund - cost;
  if (nextBalance < 0) {
    return { ok: false, reason: 'balance' };
  }

  return {
    ok: true,
    bets: layout,
    cost,
    refund,
    nextBalance: clampBalance(nextBalance),
  };
}

/** Cell keys for repeat-flash highlighting. */
export function repeatLayoutKeys(bets) {
  return sanitizeBets(bets).map((bet) => `${bet.type}:${bet.value ?? ''}`);
}
