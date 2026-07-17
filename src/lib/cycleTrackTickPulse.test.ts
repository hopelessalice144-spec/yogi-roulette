import { describe, expect, it } from 'vitest';
import { shouldCycleTrackTickPulse } from './cycleTrackTickPulse.js';

describe('cycleTrackTickPulse', () => {
  it('pulses only when the floored cycle second changes', () => {
    expect(shouldCycleTrackTickPulse(4, 5)).toBe(true);
    expect(shouldCycleTrackTickPulse(4.2, 4.8)).toBe(false);
    expect(shouldCycleTrackTickPulse(4.9, 5.1)).toBe(true);
    expect(shouldCycleTrackTickPulse(12, 12)).toBe(false);
  });
});
