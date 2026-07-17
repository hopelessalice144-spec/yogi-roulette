import { describe, expect, it } from 'vitest';
import { shouldUndoReadyGlow } from './undoReadyGlow.js';

describe('undoReadyGlow', () => {
  it('glows only when undo is available', () => {
    expect(shouldUndoReadyGlow(true)).toBe(true);
    expect(shouldUndoReadyGlow(false)).toBe(false);
  });
});
