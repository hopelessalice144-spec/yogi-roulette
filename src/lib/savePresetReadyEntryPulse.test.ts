import { describe, expect, it } from 'vitest';

import { shouldSavePresetReadyEntryPulse } from './savePresetReadyEntryPulse.js';

describe('savePresetReadyEntryPulse', () => {
  it('pulses only when save preset newly becomes actionable', () => {
    expect(shouldSavePresetReadyEntryPulse(false, true)).toBe(true);
    expect(shouldSavePresetReadyEntryPulse(true, true)).toBe(false);
    expect(shouldSavePresetReadyEntryPulse(true, false)).toBe(false);
    expect(shouldSavePresetReadyEntryPulse(false, false)).toBe(false);
  });
});
