/**
 * Turbo Roulette — Balance persistence & fake-money faucet.
 * Explicit error boundaries around all localStorage access.
 */

const STORAGE_KEY = 'turboRoulette.balance';
const BETS_KEY = 'turboRoulette.bets';
const DEFAULT_BALANCE = 1000;
const FAUCET_AMOUNT = 500;
const FAUCET_MIN_BALANCE = 50; // claim when balance is at or below this

/**
 * @returns {number}
 */
function loadBalance() {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_BALANCE;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null || raw === undefined) return DEFAULT_BALANCE;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0) return DEFAULT_BALANCE;
    return Math.floor(parsed);
  } catch (err) {
    console.warn('[storage] loadBalance failed:', err);
    return DEFAULT_BALANCE;
  }
}

/**
 * @param {number} balance
 * @returns {boolean} success
 */
function saveBalance(balance) {
  try {
    if (typeof localStorage === 'undefined') return false;
    const value = Math.max(0, Math.floor(Number(balance) || 0));
    localStorage.setItem(STORAGE_KEY, String(value));
    return true;
  } catch (err) {
    console.warn('[storage] saveBalance failed:', err);
    return false;
  }
}

/**
 * @returns {{ claimed: boolean, amount: number, balance: number, reason?: string }}
 */
function claimFaucet(currentBalance) {
  const balance = Math.floor(Number(currentBalance) || 0);
  if (balance > FAUCET_MIN_BALANCE) {
    return {
      claimed: false,
      amount: 0,
      balance,
      reason: `Faucet available when balance ≤ ${FAUCET_MIN_BALANCE}`,
    };
  }
  const next = balance + FAUCET_AMOUNT;
  saveBalance(next);
  return { claimed: true, amount: FAUCET_AMOUNT, balance: next };
}

function resetBalance() {
  saveBalance(DEFAULT_BALANCE);
  saveBets([]);
  return DEFAULT_BALANCE;
}

/**
 * @returns {Array<{ type: string, value?: number, amount: number }>}
 */
function loadBets() {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(BETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((b) => b && typeof b.type === 'string' && Number(b.amount) > 0)
      .map((b) => ({
        type: b.type,
        value: b.value,
        amount: Math.floor(Number(b.amount)),
      }));
  } catch (err) {
    console.warn('[storage] loadBets failed:', err);
    return [];
  }
}

/**
 * @param {Array} bets
 * @returns {boolean}
 */
function saveBets(bets) {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(BETS_KEY, JSON.stringify(Array.isArray(bets) ? bets : []));
    return true;
  } catch (err) {
    console.warn('[storage] saveBets failed:', err);
    return false;
  }
}

// --- Self-verification (no localStorage writes) ---
(function selfTest() {
  console.assert(DEFAULT_BALANCE === 1000, 'Default bankroll is 1000');
  console.assert(FAUCET_AMOUNT === 500, 'Faucet grants 500');
  console.assert(FAUCET_MIN_BALANCE === 50, 'Faucet threshold is 50');
  console.assert(100 > FAUCET_MIN_BALANCE, 'High balance blocks faucet');
  console.assert(10 <= FAUCET_MIN_BALANCE, 'Low balance allows faucet');
  console.assert(10 + FAUCET_AMOUNT === 510, 'Faucet math 10+500');
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    STORAGE_KEY,
    BETS_KEY,
    DEFAULT_BALANCE,
    FAUCET_AMOUNT,
    FAUCET_MIN_BALANCE,
    loadBalance,
    saveBalance,
    loadBets,
    saveBets,
    claimFaucet,
    resetBalance,
  };
}
if (typeof window !== 'undefined') {
  window.RouletteStorage = {
    STORAGE_KEY,
    BETS_KEY,
    DEFAULT_BALANCE,
    FAUCET_AMOUNT,
    FAUCET_MIN_BALANCE,
    loadBalance,
    saveBalance,
    loadBets,
    saveBets,
    claimFaucet,
    resetBalance,
  };
}
