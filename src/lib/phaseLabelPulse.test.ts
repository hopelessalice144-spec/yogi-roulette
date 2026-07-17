import { describe, expect, it } from 'vitest';
import { shouldPhaseLabelPulse } from './phaseLabelPulse.js';

describe('phaseLabelPulse', () => {
  it('pulses only when the ball phase label changes', () => {
    expect(shouldPhaseLabelPulse('Orbit', 'Descent')).toBe(true);
    expect(shouldPhaseLabelPulse('Orbit', 'Orbit')).toBe(false);
    expect(shouldPhaseLabelPulse('Live Drop', 'Live Drop')).toBe(false);
  });
});
