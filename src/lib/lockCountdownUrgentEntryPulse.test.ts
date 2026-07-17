import { describe, expect, it } from 'vitest';
import { shouldLockCountdownUrgentEntryPulse } from './lockCountdownUrgentEntryPulse.js';

describe('lockCountdownUrgentEntryPulse', () => {
  it('pulses only when the lock countdown becomes newly urgent', () => {
    expect(shouldLockCountdownUrgentEntryPulse(false, true)).toBe(true);
    expect(shouldLockCountdownUrgentEntryPulse(true, true)).toBe(false);
    expect(shouldLockCountdownUrgentEntryPulse(true, false)).toBe(false);
    expect(shouldLockCountdownUrgentEntryPulse(false, false)).toBe(false);
  });
});
