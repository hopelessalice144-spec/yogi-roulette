/**
 * Tamper-evident localStorage wrapper — SHA-256 integrity checksum validation.
 */
import { clampBalance, sanitizeBets } from './betSchema.js';
import { integrityDigest } from './integrityDigest.js';

const STORAGE_VERSION = 2;

function wrapRecord(data) {
  const body = JSON.stringify(data);
  return JSON.stringify({ v: STORAGE_VERSION, data, checksum: integrityDigest(body) });
}

function unwrapRecord(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.v !== STORAGE_VERSION || parsed.data === undefined) return null;
    const body = JSON.stringify(parsed.data);
    if (parsed.checksum !== integrityDigest(body)) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function secureLoadBalance(storageKey, defaultBalance) {
  try {
    if (typeof localStorage === 'undefined') return defaultBalance;
    const raw = localStorage.getItem(storageKey);
    if (raw === null) return defaultBalance;

    const wrapped = unwrapRecord(raw);
    if (wrapped !== null && Number.isFinite(wrapped.balance)) {
      return clampBalance(wrapped.balance);
    }

    const legacy = Number(raw);
    if (Number.isFinite(legacy) && legacy >= 0) {
      return clampBalance(legacy);
    }
    return defaultBalance;
  } catch {
    return defaultBalance;
  }
}

export function secureSaveBalance(storageKey, balance) {
  try {
    if (typeof localStorage === 'undefined') return false;
    const safe = clampBalance(balance);
    localStorage.setItem(storageKey, wrapRecord({ balance: safe }));
    return true;
  } catch {
    return false;
  }
}

export function secureLoadBets(storageKey) {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];

    const wrapped = unwrapRecord(raw);
    if (wrapped !== null && Array.isArray(wrapped.bets)) {
      return sanitizeBets(wrapped.bets);
    }

    const legacy = JSON.parse(raw);
    return sanitizeBets(legacy);
  } catch {
    return [];
  }
}

export function secureSaveBets(storageKey, bets) {
  try {
    if (typeof localStorage === 'undefined') return false;
    const safe = sanitizeBets(bets);
    localStorage.setItem(storageKey, wrapRecord({ bets: safe }));
    return true;
  } catch {
    return false;
  }
}

console.assert(integrityDigest('test').length === 64, 'storage checksum sha256');
