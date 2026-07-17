import { describe, expect, it } from 'vitest';

import { shouldBatchStakeEntryPulse } from './batchStakeEntryPulse.js';



describe('batchStakeEntryPulse', () => {

  it('pulses only when a batch stake key is active', () => {

    expect(shouldBatchStakeEntryPulse(0)).toBe(false);

    expect(shouldBatchStakeEntryPulse(3)).toBe(true);

  });

});

