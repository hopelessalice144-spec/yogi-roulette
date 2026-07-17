import { describe, expect, it } from 'vitest';

import { shouldChipRackBettingGlowEntryPulse } from './chipRackBettingGlowEntryPulse.js';



describe('chipRackBettingGlowEntryPulse', () => {

  it('pulses only when chip rack betting glow newly activates', () => {

    expect(shouldChipRackBettingGlowEntryPulse(false, true)).toBe(true);

    expect(shouldChipRackBettingGlowEntryPulse(true, true)).toBe(false);

    expect(shouldChipRackBettingGlowEntryPulse(true, false)).toBe(false);

    expect(shouldChipRackBettingGlowEntryPulse(false, false)).toBe(false);

  });

});

