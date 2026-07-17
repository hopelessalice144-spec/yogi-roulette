import { describe, expect, it } from 'vitest';

import { shouldInstallPromptReadyEntryPulse } from './installPromptReadyEntryPulse.js';

describe('installPromptReadyEntryPulse', () => {
  it('pulses only when install prompt newly becomes actionable', () => {
    expect(shouldInstallPromptReadyEntryPulse(false, true)).toBe(true);
    expect(shouldInstallPromptReadyEntryPulse(true, true)).toBe(false);
    expect(shouldInstallPromptReadyEntryPulse(true, false)).toBe(false);
    expect(shouldInstallPromptReadyEntryPulse(false, false)).toBe(false);
  });
});
