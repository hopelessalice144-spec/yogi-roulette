import { describe, expect, it } from 'vitest';

import { shouldShortcutsOverlayReadyEntryPulse } from './shortcutsOverlayReadyEntryPulse.js';

describe('shortcutsOverlayReadyEntryPulse', () => {
  it('pulses only when shortcuts help newly becomes actionable', () => {
    expect(shouldShortcutsOverlayReadyEntryPulse(false, true)).toBe(true);
    expect(shouldShortcutsOverlayReadyEntryPulse(true, true)).toBe(false);
    expect(shouldShortcutsOverlayReadyEntryPulse(true, false)).toBe(false);
    expect(shouldShortcutsOverlayReadyEntryPulse(false, false)).toBe(false);
  });
});
