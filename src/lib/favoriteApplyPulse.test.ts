import { describe, expect, it } from 'vitest';
import { shouldFavoriteApplyPulse } from './favoriteApplyPulse.js';

describe('favoriteApplyPulse', () => {
  it('pulses only when preset apply succeeded', () => {
    expect(shouldFavoriteApplyPulse(true)).toBe(true);
    expect(shouldFavoriteApplyPulse(false)).toBe(false);
    expect(shouldFavoriteApplyPulse(null)).toBe(false);
  });
});
