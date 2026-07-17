import { describe, expect, it } from 'vitest';
import { shouldFairnessPanelReadyPulse } from './fairnessPanelReadyPulse.js';

describe('fairnessPanelReadyPulse', () => {
  it('pulses only when fairness history becomes newly available', () => {
    expect(shouldFairnessPanelReadyPulse(false, true)).toBe(true);
    expect(shouldFairnessPanelReadyPulse(true, true)).toBe(false);
    expect(shouldFairnessPanelReadyPulse(true, false)).toBe(false);
    expect(shouldFairnessPanelReadyPulse(false, false)).toBe(false);
  });
});
