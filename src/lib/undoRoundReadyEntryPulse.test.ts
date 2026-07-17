import { describe, expect, it } from 'vitest';

import { shouldUndoRoundReadyEntryPulse } from './undoRoundReadyEntryPulse.js';

describe('undoRoundReadyEntryPulse', () => {
  it('pulses only when undo newly becomes actionable', () => {
    expect(shouldUndoRoundReadyEntryPulse(false, true)).toBe(true);
    expect(shouldUndoRoundReadyEntryPulse(true, true)).toBe(false);
    expect(shouldUndoRoundReadyEntryPulse(true, false)).toBe(false);
    expect(shouldUndoRoundReadyEntryPulse(false, false)).toBe(false);
  });
});
