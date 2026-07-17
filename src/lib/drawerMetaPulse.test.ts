import { describe, expect, it } from 'vitest';
import { shouldDrawerMetaPulse } from './drawerMetaPulse.js';

describe('drawerMetaPulse', () => {
  it('pulses only when the staked total changes', () => {
    expect(shouldDrawerMetaPulse(0, 25)).toBe(true);
    expect(shouldDrawerMetaPulse(50, 75)).toBe(true);
    expect(shouldDrawerMetaPulse(50, 50)).toBe(false);
  });
});
