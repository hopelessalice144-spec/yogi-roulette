import { describe, expect, it } from 'vitest';
import { shouldSavePresetReadyGlow } from './savePresetReadyGlow.js';

describe('savePresetReadyGlow', () => {
  it('glows only when betting is open and chips are staked', () => {
    expect(shouldSavePresetReadyGlow(true, 100)).toBe(true);
    expect(shouldSavePresetReadyGlow(false, 100)).toBe(false);
    expect(shouldSavePresetReadyGlow(true, 0)).toBe(false);
  });
});
