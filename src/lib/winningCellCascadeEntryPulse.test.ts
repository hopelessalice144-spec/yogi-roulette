import { describe, expect, it } from 'vitest';
import { shouldWinningCellCascadeEntryPulse } from './winningCellCascadeEntryPulse.js';

describe('winningCellCascadeEntryPulse', () => {
  it('pulses only when winning cell cascade becomes newly active', () => {
    expect(shouldWinningCellCascadeEntryPulse(false, true)).toBe(true);
    expect(shouldWinningCellCascadeEntryPulse(true, true)).toBe(false);
    expect(shouldWinningCellCascadeEntryPulse(true, false)).toBe(false);
    expect(shouldWinningCellCascadeEntryPulse(false, false)).toBe(false);
  });
});
