import { describe, expect, it } from 'vitest';
import { shouldStatusLineReadyPulse } from './statusLineReadyPulse.js';

describe('statusLineReadyPulse', () => {
  it('pulses only when the status line becomes newly actionable', () => {
    expect(shouldStatusLineReadyPulse(false, true)).toBe(true);
    expect(shouldStatusLineReadyPulse(true, true)).toBe(false);
    expect(shouldStatusLineReadyPulse(true, false)).toBe(false);
    expect(shouldStatusLineReadyPulse(false, false)).toBe(false);
  });
});
