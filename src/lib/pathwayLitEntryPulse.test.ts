import { describe, expect, it } from 'vitest';
import { shouldPathwayLitEntryPulse } from './pathwayLitEntryPulse.js';

describe('pathwayLitEntryPulse', () => {
  it('pulses only when pathway-lit becomes newly active on a cell', () => {
    expect(shouldPathwayLitEntryPulse(false, true)).toBe(true);
    expect(shouldPathwayLitEntryPulse(true, true)).toBe(false);
    expect(shouldPathwayLitEntryPulse(true, false)).toBe(false);
    expect(shouldPathwayLitEntryPulse(false, false)).toBe(false);
  });
});
