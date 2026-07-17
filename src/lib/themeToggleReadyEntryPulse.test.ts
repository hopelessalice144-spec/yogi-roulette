import { describe, expect, it } from 'vitest';

import { shouldThemeToggleReadyEntryPulse } from './themeToggleReadyEntryPulse.js';

describe('themeToggleReadyEntryPulse', () => {
  it('pulses only when theme toggle newly becomes actionable', () => {
    expect(shouldThemeToggleReadyEntryPulse(false, true)).toBe(true);
    expect(shouldThemeToggleReadyEntryPulse(true, true)).toBe(false);
    expect(shouldThemeToggleReadyEntryPulse(true, false)).toBe(false);
    expect(shouldThemeToggleReadyEntryPulse(false, false)).toBe(false);
  });
});
