import { describe, expect, it } from 'vitest';
import { shouldUndoRoundReadyPulse } from './undoRoundReadyPulse.js';

describe('undoRoundReadyPulse', () => {
  it('pulses only when undo becomes newly available', () => {
    expect(shouldUndoRoundReadyPulse(false, true)).toBe(true);
    expect(shouldUndoRoundReadyPulse(true, true)).toBe(false);
    expect(shouldUndoRoundReadyPulse(true, false)).toBe(false);
    expect(shouldUndoRoundReadyPulse(false, false)).toBe(false);
  });
});
