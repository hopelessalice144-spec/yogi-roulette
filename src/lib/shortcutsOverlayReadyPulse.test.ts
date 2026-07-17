import { describe, expect, it } from 'vitest';
import { shouldShortcutsOverlayReadyPulse } from './shortcutsOverlayReadyPulse.js';

describe('shortcutsOverlayReadyPulse', () => {
  it('pulses only when shortcuts help becomes newly actionable', () => {
    expect(shouldShortcutsOverlayReadyPulse(false, true)).toBe(true);
    expect(shouldShortcutsOverlayReadyPulse(true, true)).toBe(false);
    expect(shouldShortcutsOverlayReadyPulse(true, false)).toBe(false);
    expect(shouldShortcutsOverlayReadyPulse(false, false)).toBe(false);
  });
});
