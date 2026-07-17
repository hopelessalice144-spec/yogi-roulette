import { describe, expect, it } from 'vitest';

import { shouldChipLandedEntryPulse } from './chipLandedEntryPulse.js';



describe('chipLandedEntryPulse', () => {

  it('pulses only when chip newly lands on a cell', () => {

    expect(shouldChipLandedEntryPulse(false, true)).toBe(true);

    expect(shouldChipLandedEntryPulse(true, true)).toBe(false);

    expect(shouldChipLandedEntryPulse(true, false)).toBe(false);

    expect(shouldChipLandedEntryPulse(false, false)).toBe(false);

  });

});

