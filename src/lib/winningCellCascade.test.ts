import { describe, expect, it } from 'vitest';
import {
  CASCADE_STEP_MS,
  buildWinningCascadeMap,
  cellIsWinningBet,
  cellKey,
  winningCellCascadeDelay,
} from './winningCellCascade.js';

describe('winningCellCascade', () => {
  it('detects winning bet cells', () => {
    expect(cellIsWinningBet('red', undefined, 7)).toBe(true);
    expect(cellIsWinningBet('red', undefined, 8)).toBe(false);
  });

  it('builds cascade indices in board order', () => {
    const specs = [
      { type: 'straight', value: 0 },
      { type: 'straight', value: 7 },
      { type: 'red', value: undefined },
      { type: 'odd', value: undefined },
    ];
    const map = buildWinningCascadeMap(specs, 7);
    expect(map.get(cellKey('straight', 7))).toBe(0);
    expect(map.get(cellKey('red', undefined))).toBe(1);
    expect(map.get(cellKey('odd', undefined))).toBe(2);
    expect(map.get(cellKey('straight', 0))).toBeUndefined();
  });

  it('steps cascade delay by slot index', () => {
    expect(winningCellCascadeDelay(0)).toBe(0);
    expect(winningCellCascadeDelay(2)).toBe(CASCADE_STEP_MS * 2);
  });
});
