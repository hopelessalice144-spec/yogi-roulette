import { describe, expect, it } from 'vitest';
import { shouldPhaseCountdownEntryPulse } from './phaseCountdownEntryPulse.js';

describe('phaseCountdownEntryPulse', () => {
  it('pulses only when the countdown ring becomes newly active', () => {
    expect(shouldPhaseCountdownEntryPulse(false, true)).toBe(true);
    expect(shouldPhaseCountdownEntryPulse(true, true)).toBe(false);
    expect(shouldPhaseCountdownEntryPulse(true, false)).toBe(false);
    expect(shouldPhaseCountdownEntryPulse(false, false)).toBe(false);
  });
});
