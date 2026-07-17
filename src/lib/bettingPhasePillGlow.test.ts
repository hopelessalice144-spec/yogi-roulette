import { describe, expect, it } from 'vitest';
import { shouldBettingPhasePillGlow } from './bettingPhasePillGlow.js';

describe('bettingPhasePillGlow', () => {
  it('glows only during the betting phase', () => {
    expect(shouldBettingPhasePillGlow('betting')).toBe(true);
    expect(shouldBettingPhasePillGlow('locked')).toBe(false);
    expect(shouldBettingPhasePillGlow('spinning')).toBe(false);
  });
});
