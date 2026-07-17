import { describe, expect, it } from 'vitest';

import { shouldChipUndoClearEntryPulse } from './chipUndoClearEntryPulse.js';



describe('chipUndoClearEntryPulse', () => {

  it('pulses only when undo clear newly activates on a cell', () => {

    expect(shouldChipUndoClearEntryPulse(false, true)).toBe(true);

    expect(shouldChipUndoClearEntryPulse(true, true)).toBe(false);

    expect(shouldChipUndoClearEntryPulse(true, false)).toBe(false);

    expect(shouldChipUndoClearEntryPulse(false, false)).toBe(false);

  });

});

