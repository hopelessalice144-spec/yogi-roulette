import { describe, expect, it } from 'vitest';
import { shouldStatusLineReadyGlow } from './statusLineReadyGlow.js';

describe('statusLineReadyGlow', () => {
  it('glows only while betting is open', () => {
    expect(shouldStatusLineReadyGlow(true)).toBe(true);
    expect(shouldStatusLineReadyGlow(false)).toBe(false);
  });
});
