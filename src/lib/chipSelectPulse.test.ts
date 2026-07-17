import { describe, expect, it } from 'vitest';
import { shouldChipSelectPulse } from './chipSelectPulse.js';

describe('chipSelectPulse', () => {
  it('pulses only when selection value changes', () => {
    expect(shouldChipSelectPulse(25, 50)).toBe(true);
    expect(shouldChipSelectPulse(25, 25)).toBe(false);
    expect(shouldChipSelectPulse(25, NaN)).toBe(false);
  });
});
