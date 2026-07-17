import { evaluateBet } from './math.js';

export const CASCADE_STEP_MS = 70;

export function cellKey(type, value) {
  return `${type}:${value ?? ''}`;
}

export function cellIsWinningBet(type, value, winningNumber) {
  if (winningNumber === null || winningNumber === undefined) return false;
  return evaluateBet({ type, value, amount: 1 }, winningNumber) > 1;
}

export function winningCellCascadeDelay(index) {
  if (!Number.isInteger(index) || index < 0) return 0;
  return index * CASCADE_STEP_MS;
}

/** Map cell keys to cascade index in board scan order. */
export function buildWinningCascadeMap(specs, winningNumber) {
  const map = new Map();
  if (winningNumber === null || winningNumber === undefined) return map;

  let index = 0;
  for (const spec of specs) {
    if (!spec?.type) continue;
    if (cellIsWinningBet(spec.type, spec.value, winningNumber)) {
      map.set(cellKey(spec.type, spec.value), index++);
    }
  }
  return map;
}
