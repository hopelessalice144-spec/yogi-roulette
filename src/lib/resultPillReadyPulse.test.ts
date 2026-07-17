import { describe, expect, it } from 'vitest';
import { shouldResultPillReadyPulse } from './resultPillReadyPulse.js';

describe('resultPillReadyPulse', () => {
  it('pulses only when the result pill becomes newly actionable', () => {
    expect(shouldResultPillReadyPulse(false, true)).toBe(true);
    expect(shouldResultPillReadyPulse(true, true)).toBe(false);
    expect(shouldResultPillReadyPulse(true, false)).toBe(false);
    expect(shouldResultPillReadyPulse(false, false)).toBe(false);
  });
});
