import {
  CHIP_VALUES,
  MAX_BET_PER_CELL,
  MAX_TOTAL_STAKED,
  clampBalance,
  sanitizeBet,
  sanitizeBets,
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

/** Merge a saved preset onto the current board (adds stake per cell). */
export function mergePresetBets(currentBets, presetBets) {
  const base = sanitizeBets(currentBets);
  const incoming = sanitizeBets(presetBets);
  if (!incoming.length) return base;

  let next = base.map((b) => ({ ...b }));
  let runningTotal = totalStaked(next);

  for (const bet of incoming) {
    const idx = next.findIndex(
      (b) => b.type === bet.type && String(b.value ?? '') === String(bet.value ?? '')
    );
    if (idx >= 0) {
      const newAmount = next[idx].amount + bet.amount;
      if (newAmount > MAX_BET_PER_CELL) return currentBets;
      next[idx] = { ...next[idx], amount: newAmount };
    } else {
      if (runningTotal + bet.amount > MAX_TOTAL_STAKED) return currentBets;
      next.push({ ...bet });
    }
    runningTotal += bet.amount;
  }

  return next;
}

const betCellKey = (bet) => `${bet.type}:${bet.value ?? ''}`;

/** Cell key that lost the most recent chip when restoring an undo snapshot. */
export function undoFlashKey(currentBets, restoredBets) {
  const current = sanitizeBets(currentBets);
  const restored = sanitizeBets(restoredBets);
  const curMap = new Map();
  for (const bet of current) curMap.set(betCellKey(bet), bet.amount);
  for (const bet of restored) {
    const key = betCellKey(bet);
    const curAmt = curMap.get(key) ?? 0;
    if (curAmt > bet.amount) return key;
    curMap.delete(key);
  }
  for (const key of curMap.keys()) return key;
  return null;
}

/** Scale every cell stake by ½ or 2×, respecting table limits. */
export function scaleBoardBets(bets, factor) {
  const safe = sanitizeBets(bets);
  if (!safe.length || (factor !== 0.5 && factor !== 2)) {
    return { ok: false, reason: 'empty' };
  }

  const scaled = [];
  for (const bet of safe) {
    const amount = factor === 0.5 ? Math.floor(bet.amount / 2) : bet.amount * 2;
    if (amount <= 0) continue;
    if (amount > MAX_BET_PER_CELL) {
      return { ok: false, reason: 'cell_limit' };
    }
    const entry = { ...bet, amount };
    const sanitized = sanitizeBet(entry);
    if (!sanitized) return { ok: false, reason: 'invalid' };
    scaled.push(sanitized);
  }

  if (!scaled.length) {
    return { ok: false, reason: 'empty_after_scale' };
  }

  if (totalStaked(scaled) > MAX_TOTAL_STAKED) {
    return { ok: false, reason: 'limit' };
  }

  return { ok: true, bets: scaled };
}

/** Apply a board scale factor with wallet refund/charge semantics. */
export function scaleBoardWallet(currentBalance, currentBets, factor) {
  const scaled = scaleBoardBets(currentBets, factor);
  if (!scaled.ok) return scaled;

  const refund = totalStaked(sanitizeBets(currentBets));
  const cost = totalStaked(scaled.bets);
  const nextBalance = currentBalance + refund - cost;
  if (nextBalance < 0) {
    return { ok: false, reason: 'balance' };
  }

  return {
    ok: true,
    bets: scaled.bets,
    cost,
    refund,
    factor,
    nextBalance: clampBalance(nextBalance),
  };
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
