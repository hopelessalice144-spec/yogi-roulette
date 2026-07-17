import { describe, expect, it } from 'vitest';
import { shouldLockBannerReadyPulse } from './lockBannerReadyPulse.js';

describe('lockBannerReadyPulse', () => {
  it('pulses only when the lock banner becomes newly visible', () => {
    expect(shouldLockBannerReadyPulse(false, true)).toBe(true);
    expect(shouldLockBannerReadyPulse(true, true)).toBe(false);
    expect(shouldLockBannerReadyPulse(true, false)).toBe(false);
    expect(shouldLockBannerReadyPulse(false, false)).toBe(false);
  });
});
