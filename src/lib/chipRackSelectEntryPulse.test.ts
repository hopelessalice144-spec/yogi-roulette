import { describe, expect, it } from 'vitest';

import { shouldChipRackSelectEntryPulse } from './chipRackSelectEntryPulse.js';



describe('chipRackSelectEntryPulse', () => {

  it('pulses only when chip rack selection changes', () => {

    expect(shouldChipRackSelectEntryPulse(25, 50)).toBe(true);

    expect(shouldChipRackSelectEntryPulse(25, 25)).toBe(false);

    expect(shouldChipRackSelectEntryPulse(25, NaN)).toBe(false);

  });

});

