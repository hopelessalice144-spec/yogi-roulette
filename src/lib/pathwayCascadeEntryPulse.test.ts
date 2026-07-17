import { describe, expect, it } from 'vitest';
import { shouldPathwayCascadeEntryPulse } from './pathwayCascadeEntryPulse.js';

describe('pathwayCascadeEntryPulse', () => {
  it('pulses only when pathway cascade becomes newly active', () => {
    expect(shouldPathwayCascadeEntryPulse(false, true)).toBe(true);
    expect(shouldPathwayCascadeEntryPulse(true, true)).toBe(false);
    expect(shouldPathwayCascadeEntryPulse(true, false)).toBe(false);
    expect(shouldPathwayCascadeEntryPulse(false, false)).toBe(false);
  });
});
