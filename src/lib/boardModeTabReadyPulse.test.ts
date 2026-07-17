import { describe, expect, it } from 'vitest';
import { shouldBoardModeTabReadyPulse } from './boardModeTabReadyPulse.js';

describe('boardModeTabReadyPulse', () => {
  it('pulses only when a layout tab becomes newly actionable', () => {
    expect(shouldBoardModeTabReadyPulse(false, true)).toBe(true);
    expect(shouldBoardModeTabReadyPulse(true, true)).toBe(false);
    expect(shouldBoardModeTabReadyPulse(true, false)).toBe(false);
    expect(shouldBoardModeTabReadyPulse(false, false)).toBe(false);
  });
});
