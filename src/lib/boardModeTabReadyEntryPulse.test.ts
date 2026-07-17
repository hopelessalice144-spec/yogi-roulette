import { describe, expect, it } from 'vitest';

import { shouldBoardModeTabReadyEntryPulse } from './boardModeTabReadyEntryPulse.js';

describe('boardModeTabReadyEntryPulse', () => {
  it('pulses only when board mode tab newly becomes actionable', () => {
    expect(shouldBoardModeTabReadyEntryPulse(false, true)).toBe(true);
    expect(shouldBoardModeTabReadyEntryPulse(true, true)).toBe(false);
    expect(shouldBoardModeTabReadyEntryPulse(true, false)).toBe(false);
    expect(shouldBoardModeTabReadyEntryPulse(false, false)).toBe(false);
  });
});
