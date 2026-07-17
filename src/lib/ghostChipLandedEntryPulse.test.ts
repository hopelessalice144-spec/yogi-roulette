import { describe, expect, it } from 'vitest';

import { shouldGhostChipLandedEntryPulse } from './ghostChipLandedEntryPulse.js';



describe('ghostChipLandedEntryPulse', () => {

  it('pulses only when a ghost chip newly lands', () => {

    expect(shouldGhostChipLandedEntryPulse(false, true)).toBe(true);

    expect(shouldGhostChipLandedEntryPulse(true, true)).toBe(false);

    expect(shouldGhostChipLandedEntryPulse(true, false)).toBe(false);

    expect(shouldGhostChipLandedEntryPulse(false, false)).toBe(false);

  });

});

