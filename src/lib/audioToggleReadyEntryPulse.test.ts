import { describe, expect, it } from 'vitest';

import { shouldAudioToggleReadyEntryPulse } from './audioToggleReadyEntryPulse.js';

describe('audioToggleReadyEntryPulse', () => {
  it('pulses only when audio toggle newly becomes actionable', () => {
    expect(shouldAudioToggleReadyEntryPulse(false, true)).toBe(true);
    expect(shouldAudioToggleReadyEntryPulse(true, true)).toBe(false);
    expect(shouldAudioToggleReadyEntryPulse(true, false)).toBe(false);
    expect(shouldAudioToggleReadyEntryPulse(false, false)).toBe(false);
  });
});
