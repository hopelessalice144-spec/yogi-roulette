import { describe, expect, it } from 'vitest';
import {
  applyGuidedDeceleration,
  blendWheelSpinVelocity,
  dampSpinVelocity,
} from './wheelSpinEase.js';

describe('wheelSpinEase', () => {
  it('dampSpinVelocity moves toward target', () => {
    const next = dampSpinVelocity(0, 2, 4, 0.016);
    expect(next).toBeGreaterThan(0);
    expect(next).toBeLessThan(2);
  });

  it('applyGuidedDeceleration slows near settle', () => {
    expect(applyGuidedDeceleration(2, 27)).toBe(2);
    expect(applyGuidedDeceleration(2, 29)).toBeLessThan(1.2);
  });

  it('blendWheelSpinVelocity respects deceleration window', () => {
    const early = blendWheelSpinVelocity(0.5, 3, 0.016, 26);
    const late = blendWheelSpinVelocity(3, 0.85, 0.016, 29);
    expect(early).toBeGreaterThan(0.5);
    expect(late).toBeLessThan(3);
  });
});
