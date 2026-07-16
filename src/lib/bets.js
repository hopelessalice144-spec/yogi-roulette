import {
  CHIP_VALUES,
  MAX_BET_PER_CELL,
  sanitizeBet,
  validateBetTarget,
  validateChipValue,
} from './betSchema.js';

export { CHIP_VALUES };

export function placeChip(bets, target, chip) {
  if (!validateChipValue(chip) || !validateBetTarget(target)) return bets;

  const safeChip = Math.floor(chip);
  const next = bets.map((b) => ({ ...b }));
  const idx = next.findIndex(
    (b) => b.type === target.type && String(b.value ?? '') === String(target.value ?? '')
  );

  if (idx >= 0) {
    const newAmount = next[idx].amount + safeChip;
    if (newAmount > MAX_BET_PER_CELL) return bets;
    next[idx] = { ...next[idx], amount: newAmount };
  } else {
    const entry = { type: target.type, amount: safeChip };
    if (target.value !== undefined && target.value !== null && target.value !== '') {
      if (target.type === 'straight' || target.type === 'dozen' || target.type === 'column') {
        entry.value = Number(target.value);
      } else {
        entry.value = String(target.value);
      }
    }
    const sanitized = sanitizeBet(entry);
    if (!sanitized) return bets;
    next.push(sanitized);
  }
  return next;
}

export function totalStaked(bets) {
  return bets.reduce((sum, b) => sum + (Number.isFinite(b.amount) ? b.amount : 0), 0);
}

export function settleAll(bets, winningNumber, evaluateBetFn) {
  const win = Math.floor(Number(winningNumber));
  if (!Number.isInteger(win) || win < 0 || win > 36) return 0;
  return bets.reduce((sum, bet) => {
    const safe = sanitizeBet(bet);
    if (!safe) return sum;
    return sum + evaluateBetFn(safe, win);
  }, 0);
}

console.assert(placeChip([], { type: 'red' }, 7.5).length === 0, 'reject fractional chip');
console.assert(placeChip([], { type: 'red' }, 25).length === 1, 'accept valid chip');
