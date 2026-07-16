/**
 * Bet & chip schema validation — reject tampered / invalid client inputs.
 */

export const CHIP_VALUES = Object.freeze([1, 5, 25, 100, 500]);
export const MAX_BALANCE = 1_000_000;
export const MAX_BET_PER_CELL = 50_000;
export const MAX_TOTAL_STAKED = 200_000;

export const ALLOWED_BET_TYPES = Object.freeze([
  'straight',
  'red',
  'black',
  'odd',
  'even',
  'low',
  'high',
  'dozen',
  'column',
]);

const CHIP_SET = new Set(CHIP_VALUES);

/** Integer chip from whitelist only. */
export function validateChipValue(chip) {
  const n = Number(chip);
  return Number.isInteger(n) && n > 0 && CHIP_SET.has(n);
}

/** Clamp balance to safe integer range. */
export function clampBalance(balance) {
  const n = Math.floor(Number(balance));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, MAX_BALANCE);
}

/** Validate a bet placement target from UI / drag-drop. */
export function validateBetTarget(target) {
  if (!target || typeof target !== 'object') return false;
  const type = target.type;
  if (!ALLOWED_BET_TYPES.includes(type)) return false;

  switch (type) {
    case 'straight': {
      const v = Number(target.value);
      return Number.isInteger(v) && v >= 0 && v <= 36;
    }
    case 'dozen': {
      const d = Number(target.value);
      return d === 1 || d === 2 || d === 3;
    }
    case 'column': {
      const c = Number(target.value);
      return c === 1 || c === 2 || c === 3;
    }
    case 'red':
    case 'black':
    case 'odd':
    case 'even':
    case 'low':
    case 'high':
      return target.value === undefined || target.value === null || target.value === '';
    default:
      return false;
  }
}

/** Normalize and validate a stored bet record. */
export function sanitizeBet(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const type = raw.type;
  if (!ALLOWED_BET_TYPES.includes(type)) return null;

  const amount = Math.floor(Number(raw.amount));
  if (!Number.isInteger(amount) || amount <= 0 || amount > MAX_BET_PER_CELL) return null;

  const target = { type, amount };
  if (type === 'straight' || type === 'dozen' || type === 'column') {
    target.value = Number(raw.value);
  }

  if (!validateBetTarget(target)) return null;
  return target;
}

/** Filter + cap tampered bet arrays from localStorage. */
export function sanitizeBets(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  let total = 0;
  for (const item of raw) {
    const bet = sanitizeBet(item);
    if (!bet) continue;
    if (total + bet.amount > MAX_TOTAL_STAKED) break;
    total += bet.amount;
    out.push(bet);
  }
  return out;
}

console.assert(validateChipValue(25), 'valid chip');
console.assert(!validateChipValue(7.5), 'reject fractional chip');
console.assert(validateBetTarget({ type: 'red' }), 'outside red valid');
