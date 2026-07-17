import { describe, expect, it } from 'vitest';
import { shouldInstallPromptReadyGlow } from './installPromptReadyGlow.js';

describe('installPromptReadyGlow', () => {
  it('glows only while the install prompt is visible', () => {
    expect(shouldInstallPromptReadyGlow(true)).toBe(true);
    expect(shouldInstallPromptReadyGlow(false)).toBe(false);
  });
});
