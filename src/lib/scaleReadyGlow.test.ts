import { describe, expect, it } from 'vitest';
import { shouldScaleReadyGlow } from './scaleReadyGlow.js';

describe('scaleReadyGlow', () => {
  it('glows when either scale action is available', () => {
    expect(shouldScaleReadyGlow(true, false)).toBe(true);
    expect(shouldScaleReadyGlow(false, true)).toBe(true);
    expect(shouldScaleReadyGlow(true, true)).toBe(true);
    expect(shouldScaleReadyGlow(false, false)).toBe(false);
  });
});
