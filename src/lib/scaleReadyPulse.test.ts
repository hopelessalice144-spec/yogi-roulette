import { describe, expect, it } from 'vitest';
import { shouldScaleReadyPulse } from './scaleReadyPulse.js';

describe('scaleReadyPulse', () => {
  it('pulses only when scaling becomes newly available', () => {
    expect(shouldScaleReadyPulse(false, true)).toBe(true);
    expect(shouldScaleReadyPulse(true, true)).toBe(false);
    expect(shouldScaleReadyPulse(true, false)).toBe(false);
    expect(shouldScaleReadyPulse(false, false)).toBe(false);
  });
});
