import { describe, expect, it } from 'vitest';
import { shouldSavePresetReadyPulse } from './savePresetReadyPulse.js';

describe('savePresetReadyPulse', () => {
  it('pulses only when preset save becomes newly eligible', () => {
    expect(shouldSavePresetReadyPulse(false, true)).toBe(true);
    expect(shouldSavePresetReadyPulse(true, true)).toBe(false);
    expect(shouldSavePresetReadyPulse(true, false)).toBe(false);
    expect(shouldSavePresetReadyPulse(false, false)).toBe(false);
  });
});
