import { describe, expect, it } from 'vitest';
import { shouldLockBannerReadyGlow } from './lockBannerReadyGlow.js';

describe('lockBannerReadyGlow', () => {
  it('glows only while the lock banner is visible during locked phase', () => {
    expect(shouldLockBannerReadyGlow('locked', true)).toBe(true);
    expect(shouldLockBannerReadyGlow('locked', false)).toBe(false);
    expect(shouldLockBannerReadyGlow('betting', true)).toBe(false);
  });
});
