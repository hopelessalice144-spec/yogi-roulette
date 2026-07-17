import { describe, expect, it } from 'vitest';
import { shouldBoardModeTabGlow } from './boardModeTabGlow.js';

describe('boardModeTabGlow', () => {
  it('glows only on the active tab while betting is open', () => {
    expect(shouldBoardModeTabGlow(true, true)).toBe(true);
    expect(shouldBoardModeTabGlow(true, false)).toBe(false);
    expect(shouldBoardModeTabGlow(false, true)).toBe(false);
  });
});
