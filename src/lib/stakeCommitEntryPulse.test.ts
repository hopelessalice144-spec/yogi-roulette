import { describe, expect, it } from 'vitest';

import { shouldStakeCommitEntryPulse } from './stakeCommitEntryPulse.js';



describe('stakeCommitEntryPulse', () => {

  it('pulses only when a stake commit key is active', () => {

    expect(shouldStakeCommitEntryPulse(0)).toBe(false);

    expect(shouldStakeCommitEntryPulse(2)).toBe(true);

  });

});

