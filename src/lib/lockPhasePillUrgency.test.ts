import { describe, expect, it } from 'vitest';
import { shouldLockPhasePillUrgency } from './lockPhasePillUrgency.js';

describe('lockPhasePillUrgency', () => {
  it('pulses only during the locked phase', () => {
    expect(shouldLockPhasePillUrgency('betting')).toBe(false);
    expect(shouldLockPhasePillUrgency('locked')).toBe(true);
    expect(shouldLockPhasePillUrgency('spinning')).toBe(false);
  });
});
