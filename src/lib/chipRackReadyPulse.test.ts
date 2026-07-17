import { describe, expect, it } from 'vitest';
import { shouldChipRackReadyPulse } from './chipRackReadyPulse.js';

describe('chipRackReadyPulse', () => {
  it('pulses only when the chip rack becomes newly actionable', () => {
    expect(shouldChipRackReadyPulse(false, true)).toBe(true);
    expect(shouldChipRackReadyPulse(true, true)).toBe(false);
    expect(shouldChipRackReadyPulse(true, false)).toBe(false);
    expect(shouldChipRackReadyPulse(false, false)).toBe(false);
  });
});
