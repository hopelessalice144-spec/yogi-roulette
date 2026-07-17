import { describe, expect, it } from 'vitest';
import { shouldStakeCommitPulse } from './stakeCommitPulse.js';

describe('stakeCommitPulse', () => {
  it('pulses only on successful chip commit', () => {
    expect(shouldStakeCommitPulse(true)).toBe(true);
    expect(shouldStakeCommitPulse(false)).toBe(false);
  });
});
