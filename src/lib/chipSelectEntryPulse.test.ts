import { describe, expect, it } from 'vitest';

import { shouldChipSelectEntryPulse } from './chipSelectEntryPulse.js';



describe('chipSelectEntryPulse', () => {

  it('pulses only when a chip newly becomes selected', () => {

    expect(shouldChipSelectEntryPulse(false, true)).toBe(true);

    expect(shouldChipSelectEntryPulse(true, true)).toBe(false);

    expect(shouldChipSelectEntryPulse(true, false)).toBe(false);

    expect(shouldChipSelectEntryPulse(false, false)).toBe(false);

  });

});

