import { describe, expect, it } from 'vitest';
import { shouldPathwaySourceEntryPulse } from './pathwaySourceEntryPulse.js';

describe('pathwaySourceEntryPulse', () => {
  it('pulses only when pathway-source becomes newly active on a cell', () => {
    expect(shouldPathwaySourceEntryPulse(false, true)).toBe(true);
    expect(shouldPathwaySourceEntryPulse(true, true)).toBe(false);
    expect(shouldPathwaySourceEntryPulse(true, false)).toBe(false);
    expect(shouldPathwaySourceEntryPulse(false, false)).toBe(false);
  });
});
