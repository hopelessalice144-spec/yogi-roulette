import { describe, expect, it } from 'vitest';
import { shouldMobileDrawerOpenGlow } from './mobileDrawerOpenGlow.js';

describe('mobileDrawerOpenGlow', () => {
  it('glows only on portrait mobile with betting open and drawer collapsed', () => {
    expect(shouldMobileDrawerOpenGlow(true, true, true)).toBe(true);
    expect(shouldMobileDrawerOpenGlow(true, true, false)).toBe(false);
    expect(shouldMobileDrawerOpenGlow(false, true, true)).toBe(false);
    expect(shouldMobileDrawerOpenGlow(true, false, true)).toBe(false);
  });
});
