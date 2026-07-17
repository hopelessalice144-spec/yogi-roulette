import { describe, expect, it } from 'vitest';
import { shouldRepeatReadyGlow } from './repeatReadyGlow.js';

describe('repeatReadyGlow', () => {
  it('glows only when repeat is available', () => {
    expect(shouldRepeatReadyGlow(true)).toBe(true);
    expect(shouldRepeatReadyGlow(false)).toBe(false);
  });
});
