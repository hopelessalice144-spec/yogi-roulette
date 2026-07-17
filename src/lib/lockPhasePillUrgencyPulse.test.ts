import { describe, expect, it } from 'vitest';
import { shouldLockPhasePillUrgencyPulse } from './lockPhasePillUrgencyPulse.js';

describe('lockPhasePillUrgencyPulse', () => {
  it('pulses only when the lock phase pill becomes newly urgent', () => {
    expect(shouldLockPhasePillUrgencyPulse(false, true)).toBe(true);
    expect(shouldLockPhasePillUrgencyPulse(true, true)).toBe(false);
    expect(shouldLockPhasePillUrgencyPulse(true, false)).toBe(false);
    expect(shouldLockPhasePillUrgencyPulse(false, false)).toBe(false);
  });
});
