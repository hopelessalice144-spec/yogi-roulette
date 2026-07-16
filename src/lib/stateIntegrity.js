/**
 * Client-side wallet integrity shadow — detects React/memory tampering.
 */
import { clampBalance, sanitizeBets } from './betSchema.js';
import { DEFAULT_BALANCE } from './storage.js';
import { integrityDigest } from './integrityDigest.js';
import { totalStaked } from './bets.js';

function serializeBalance(balance) {
  return `balance:${clampBalance(balance)}`;
}

function serializeBets(bets) {
  const safe = sanitizeBets(bets);
  const parts = safe.map((b) => `${b.type}|${b.value ?? ''}|${b.amount}`);
  return `bets:${parts.join(';')}|stake:${totalStaked(safe)}`;
}

/**
 * Maintains hidden SHA-256 signatures for balance + active bets.
 * On mismatch → freeze and revert to last signed snapshot.
 */
export class StateIntegrityGuard {
  constructor() {
    this._balance = DEFAULT_BALANCE;
    this._bets = [];
    this._balanceSig = '';
    this._betsSig = '';
    this._frozen = false;
    this._violationLogged = false;
  }

  signWallet(balance, bets) {
    const safeBalance = clampBalance(balance);
    const safeBets = sanitizeBets(bets);
    this._balance = safeBalance;
    this._bets = safeBets.map((b) => ({ ...b }));
    this._balanceSig = integrityDigest(serializeBalance(safeBalance));
    this._betsSig = integrityDigest(serializeBets(safeBets));
    this._frozen = false;
    return { balance: safeBalance, bets: this._bets };
  }

  verifyWallet(balance, bets) {
    if (this._frozen) {
      return {
        ok: false,
        frozen: true,
        balance: this._balance,
        bets: this._bets.map((b) => ({ ...b })),
      };
    }

    const safeBalance = clampBalance(balance);
    const safeBets = sanitizeBets(bets);
    const balanceOk = integrityDigest(serializeBalance(safeBalance)) === this._balanceSig;
    const betsOk = integrityDigest(serializeBets(safeBets)) === this._betsSig;

    if (balanceOk && betsOk) {
      return { ok: true, frozen: false, balance: safeBalance, bets: safeBets };
    }

    this._frozen = true;
    if (!this._violationLogged) {
      console.error('[SEC] State integrity violation — wallet memory tamper detected');
      this._violationLogged = true;
    }

    return {
      ok: false,
      frozen: true,
      balance: this._balance,
      bets: this._bets.map((b) => ({ ...b })),
    };
  }

  isFrozen() {
    return this._frozen;
  }

  getTrustedStake() {
    return totalStaked(this._bets);
  }
}
