import { describe, expect, it } from 'vitest';
import { shouldInstallPromptReadyPulse } from './installPromptReadyPulse.js';

describe('installPromptReadyPulse', () => {
  it('pulses only when install becomes newly available', () => {
    expect(shouldInstallPromptReadyPulse(false, true)).toBe(true);
    expect(shouldInstallPromptReadyPulse(true, true)).toBe(false);
    expect(shouldInstallPromptReadyPulse(true, false)).toBe(false);
    expect(shouldInstallPromptReadyPulse(false, false)).toBe(false);
  });
});
