import { describe, expect, it } from 'vitest';
import { shouldBetClearShake } from './betClearShake.js';

describe('betClearShake', () => {
  it('shakes only when chips were refunded', () => {
    expect(shouldBetClearShake(50)).toBe(true);
    expect(shouldBetClearShake(0)).toBe(false);
    expect(shouldBetClearShake(-10)).toBe(false);
  });
});
