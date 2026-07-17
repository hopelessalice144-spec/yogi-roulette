import { describe, expect, it } from 'vitest';

import { shouldCycleTrackTickEntryPulse } from './cycleTrackTickEntryPulse.js';

describe('cycleTrackTickEntryPulse', () => {
  it('pulses only when the floored cycle second changes', () => {
    expect(shouldCycleTrackTickEntryPulse(4, 5)).toBe(true);
    expect(shouldCycleTrackTickEntryPulse(4.2, 4.8)).toBe(false);
    expect(shouldCycleTrackTickEntryPulse(4.9, 5.1)).toBe(true);
    expect(shouldCycleTrackTickEntryPulse(12, 12)).toBe(false);
  });
});
