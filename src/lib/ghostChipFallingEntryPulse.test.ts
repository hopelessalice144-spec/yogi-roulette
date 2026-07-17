import { describe, expect, it } from 'vitest';

import { shouldGhostChipFallingEntryPulse } from './ghostChipFallingEntryPulse.js';



describe('ghostChipFallingEntryPulse', () => {

  it('pulses only when a ghost chip newly starts falling', () => {

    expect(shouldGhostChipFallingEntryPulse(false, true)).toBe(true);

    expect(shouldGhostChipFallingEntryPulse(true, true)).toBe(false);

    expect(shouldGhostChipFallingEntryPulse(true, false)).toBe(false);

    expect(shouldGhostChipFallingEntryPulse(false, false)).toBe(false);

  });

});

