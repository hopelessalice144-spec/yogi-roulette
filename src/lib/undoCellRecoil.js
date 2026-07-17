import { undoFlashKey } from './bets.js';
import { sanitizeBets } from './betSchema.js';

const betCellKey = (bet) => `${bet.type}:${bet.value ?? ''}`;

/** Metadata for undo recoil animation on the affected cell. */
export function undoCellRecoilMeta(currentBets, restoredBets) {
  const cellKey = undoFlashKey(currentBets, restoredBets);
  if (!cellKey) return null;

  const current = sanitizeBets(currentBets);
  const restored = sanitizeBets(restoredBets);
  const curAmt = current.find((bet) => betCellKey(bet) === cellKey)?.amount ?? 0;
  const restAmt = restored.find((bet) => betCellKey(bet) === cellKey)?.amount ?? 0;
  const removedAmount = curAmt - restAmt;
  if (removedAmount <= 0) return null;

  return {
    cellKey,
    kind: restAmt === 0 ? 'clear' : 'reduce',
    removedAmount,
    remainingAmount: restAmt,
  };
}

/** True when undo should play a cell recoil animation. */
export function shouldUndoCellRecoil(meta) {
  return meta?.cellKey != null && meta.removedAmount > 0;
}
