import { describe, expect, it } from 'vitest';
import { shouldShortcutsOverlayReadyGlow } from './shortcutsOverlayReadyGlow.js';

describe('shortcutsOverlayReadyGlow', () => {
  it('glows only while betting is open and help is closed', () => {
    expect(shouldShortcutsOverlayReadyGlow(true, false)).toBe(true);
    expect(shouldShortcutsOverlayReadyGlow(true, true)).toBe(false);
    expect(shouldShortcutsOverlayReadyGlow(false, false)).toBe(false);
  });
});
