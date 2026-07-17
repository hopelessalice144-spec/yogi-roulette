import { describe, expect, it } from 'vitest';
import { shouldCycleDropUrgencyEntryPulse } from './cycleDropUrgencyEntryPulse.js';

describe('cycleDropUrgencyEntryPulse', () => {
  it('pulses only when cycle drop urgency becomes newly active', () => {
    expect(shouldCycleDropUrgencyEntryPulse(false, true)).toBe(true);
    expect(shouldCycleDropUrgencyEntryPulse(true, true)).toBe(false);
    expect(shouldCycleDropUrgencyEntryPulse(true, false)).toBe(false);
    expect(shouldCycleDropUrgencyEntryPulse(false, false)).toBe(false);
  });
});
