import { describe, expect, it } from 'vitest';
import { shouldUndoCellRecoil, undoCellRecoilMeta } from './undoCellRecoil.js';

describe('undoCellRecoil', () => {
  it('marks cleared cells when undo removes the last chip', () => {
    const meta = undoCellRecoilMeta(
      [{ type: 'straight', value: 7, amount: 25 }],
      [],
    );
    expect(meta).toEqual({
      cellKey: 'straight:7',
      kind: 'clear',
      removedAmount: 25,
      remainingAmount: 0,
    });
    expect(shouldUndoCellRecoil(meta)).toBe(true);
  });

  it('marks reduced cells when undo only removes part of the stack', () => {
    const meta = undoCellRecoilMeta(
      [{ type: 'red', amount: 50 }],
      [{ type: 'red', amount: 25 }],
    );
    expect(meta).toEqual({
      cellKey: 'red:',
      kind: 'reduce',
      removedAmount: 25,
      remainingAmount: 25,
    });
    expect(shouldUndoCellRecoil(meta)).toBe(true);
  });

  it('skips recoil when no chips were removed', () => {
    expect(shouldUndoCellRecoil(null)).toBe(false);
    expect(shouldUndoCellRecoil(undoCellRecoilMeta([], []))).toBe(false);
  });
});
