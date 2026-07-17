import { describe, expect, it } from 'vitest';
import { shouldThemeToggleReadyPulse } from './themeToggleReadyPulse.js';

describe('themeToggleReadyPulse', () => {
  it('pulses only when theme switch becomes newly eligible', () => {
    expect(shouldThemeToggleReadyPulse(false, true)).toBe(true);
    expect(shouldThemeToggleReadyPulse(true, true)).toBe(false);
    expect(shouldThemeToggleReadyPulse(true, false)).toBe(false);
    expect(shouldThemeToggleReadyPulse(false, false)).toBe(false);
  });
});
