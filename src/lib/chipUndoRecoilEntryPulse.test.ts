import { describe, expect, it } from 'vitest';

import { shouldChipUndoRecoilEntryPulse } from './chipUndoRecoilEntryPulse.js';



describe('chipUndoRecoilEntryPulse', () => {

  it('pulses only when undo recoil newly activates on a cell', () => {

    expect(shouldChipUndoRecoilEntryPulse(false, true)).toBe(true);

    expect(shouldChipUndoRecoilEntryPulse(true, true)).toBe(false);

    expect(shouldChipUndoRecoilEntryPulse(true, false)).toBe(false);

    expect(shouldChipUndoRecoilEntryPulse(false, false)).toBe(false);

  });

});

