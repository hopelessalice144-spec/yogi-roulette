import { describe, expect, it } from 'vitest';
import { shouldSpinFocusEntryPulse } from './spinFocusEntryPulse.js';

describe('spinFocusEntryPulse', () => {
  it('pulses only when spin-focus dim becomes newly active', () => {
    expect(shouldSpinFocusEntryPulse(false, true)).toBe(true);
    expect(shouldSpinFocusEntryPulse(true, true)).toBe(false);
    expect(shouldSpinFocusEntryPulse(true, false)).toBe(false);
    expect(shouldSpinFocusEntryPulse(false, false)).toBe(false);
  });
});
