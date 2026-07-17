import { describe, expect, it } from 'vitest';

import { shouldLockPhasePillUrgencyEntryPulse } from './lockPhasePillUrgencyEntryPulse.js';

describe('lockPhasePillUrgencyEntryPulse', () => {
  it('pulses only when lock urgency newly becomes active', () => {
    expect(shouldLockPhasePillUrgencyEntryPulse(false, true)).toBe(true);
    expect(shouldLockPhasePillUrgencyEntryPulse(true, true)).toBe(false);
    expect(shouldLockPhasePillUrgencyEntryPulse(true, false)).toBe(false);
    expect(shouldLockPhasePillUrgencyEntryPulse(false, false)).toBe(false);
  });
});
