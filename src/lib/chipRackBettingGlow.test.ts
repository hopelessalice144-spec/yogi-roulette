import { describe, expect, it } from 'vitest';
import { shouldChipRackBettingGlow } from './chipRackBettingGlow.js';

describe('chipRackBettingGlow', () => {
  it('glows only while betting is open', () => {
    expect(shouldChipRackBettingGlow(true)).toBe(true);
    expect(shouldChipRackBettingGlow(false)).toBe(false);
  });
});
