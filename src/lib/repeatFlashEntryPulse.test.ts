import { describe, expect, it } from 'vitest';

import { shouldRepeatFlashEntryPulse } from './repeatFlashEntryPulse.js';



describe('repeatFlashEntryPulse', () => {

  it('pulses only when repeat-flash newly activates on a cell', () => {

    expect(shouldRepeatFlashEntryPulse(false, true)).toBe(true);

    expect(shouldRepeatFlashEntryPulse(true, true)).toBe(false);

    expect(shouldRepeatFlashEntryPulse(true, false)).toBe(false);

    expect(shouldRepeatFlashEntryPulse(false, false)).toBe(false);

  });

});

