import { describe, expect, it } from 'vitest';
import { shouldClearReadyPulse } from './clearReadyPulse.js';

describe('clearReadyPulse', () => {
  it('pulses only when clear becomes newly eligible', () => {
    expect(shouldClearReadyPulse(false, true)).toBe(true);
    expect(shouldClearReadyPulse(true, true)).toBe(false);
    expect(shouldClearReadyPulse(true, false)).toBe(false);
    expect(shouldClearReadyPulse(false, false)).toBe(false);
  });
});
