import { describe, expect, it } from 'vitest';
import { shouldSpinPhasePillGlow } from './spinPhasePillGlow.js';

describe('spinPhasePillGlow', () => {
  it('glows only during the spinning phase', () => {
    expect(shouldSpinPhasePillGlow('betting')).toBe(false);
    expect(shouldSpinPhasePillGlow('locked')).toBe(false);
    expect(shouldSpinPhasePillGlow('spinning')).toBe(true);
  });
});
