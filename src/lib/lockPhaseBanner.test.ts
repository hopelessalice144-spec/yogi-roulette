import { describe, expect, it } from 'vitest';
import { LOCK_BANNER_DURATION_MS, shouldShowLockBanner } from './lockPhaseBanner.js';

describe('lockPhaseBanner', () => {
  it('shows only on betting to locked transition', () => {
    expect(shouldShowLockBanner('betting', 'locked')).toBe(true);
    expect(shouldShowLockBanner('locked', 'spinning')).toBe(false);
    expect(shouldShowLockBanner('betting', 'betting')).toBe(false);
  });

  it('exports banner duration', () => {
    expect(LOCK_BANNER_DURATION_MS).toBeGreaterThan(2000);
  });
});
