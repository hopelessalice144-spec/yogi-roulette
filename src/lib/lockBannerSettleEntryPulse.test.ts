import { describe, expect, it } from 'vitest';
import { shouldLockBannerSettleEntryPulse } from './lockBannerSettleEntryPulse.js';

describe('lockBannerSettleEntryPulse', () => {
  it('pulses only when lock banner becomes newly visible', () => {
    expect(shouldLockBannerSettleEntryPulse(false, true)).toBe(true);
    expect(shouldLockBannerSettleEntryPulse(true, true)).toBe(false);
    expect(shouldLockBannerSettleEntryPulse(true, false)).toBe(false);
    expect(shouldLockBannerSettleEntryPulse(false, false)).toBe(false);
  });
});
