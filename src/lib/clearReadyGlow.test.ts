import { describe, expect, it } from 'vitest';
import { shouldClearReadyGlow } from './clearReadyGlow.js';

describe('clearReadyGlow', () => {
  it('glows only when betting is open and chips are staked', () => {
    expect(shouldClearReadyGlow(true, 25)).toBe(true);
    expect(shouldClearReadyGlow(true, 0)).toBe(false);
    expect(shouldClearReadyGlow(false, 50)).toBe(false);
  });
});
