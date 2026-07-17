import { describe, expect, it } from 'vitest';
import { shouldSpinActiveEntryPulse } from './spinActiveEntryPulse.js';

describe('spinActiveEntryPulse', () => {
  it('pulses only when the spin ring becomes newly active', () => {
    expect(shouldSpinActiveEntryPulse(false, true)).toBe(true);
    expect(shouldSpinActiveEntryPulse(true, true)).toBe(false);
    expect(shouldSpinActiveEntryPulse(true, false)).toBe(false);
    expect(shouldSpinActiveEntryPulse(false, false)).toBe(false);
  });
});
