import { describe, expect, it } from 'vitest';
import { shouldThemeToggleReadyGlow } from './themeToggleReadyGlow.js';

describe('themeToggleReadyGlow', () => {
  it('glows only after the first session round completes', () => {
    expect(shouldThemeToggleReadyGlow([])).toBe(false);
    expect(shouldThemeToggleReadyGlow([{ net: 10 }])).toBe(true);
  });
});
