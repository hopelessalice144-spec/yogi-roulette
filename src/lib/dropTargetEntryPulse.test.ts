import { describe, expect, it } from 'vitest';

import { shouldDropTargetEntryPulse } from './dropTargetEntryPulse.js';



describe('dropTargetEntryPulse', () => {

  it('pulses only when drop target newly activates on a cell', () => {

    expect(shouldDropTargetEntryPulse(false, true)).toBe(true);

    expect(shouldDropTargetEntryPulse(true, true)).toBe(false);

    expect(shouldDropTargetEntryPulse(true, false)).toBe(false);

    expect(shouldDropTargetEntryPulse(false, false)).toBe(false);

  });

});

