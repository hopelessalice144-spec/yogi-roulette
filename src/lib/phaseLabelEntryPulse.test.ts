import { describe, expect, it } from 'vitest';

import { shouldPhaseLabelEntryPulse } from './phaseLabelEntryPulse.js';

describe('phaseLabelEntryPulse', () => {
  it('pulses only when the ball phase label changes', () => {
    expect(shouldPhaseLabelEntryPulse('Orbit', 'Descent')).toBe(true);
    expect(shouldPhaseLabelEntryPulse('Orbit', 'Orbit')).toBe(false);
    expect(shouldPhaseLabelEntryPulse('Live Drop', 'Live Drop')).toBe(false);
  });
});
