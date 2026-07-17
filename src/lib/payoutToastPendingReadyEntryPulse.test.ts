import { describe, expect, it } from 'vitest';

import { shouldPayoutToastPendingReadyEntryPulse } from './payoutToastPendingReadyEntryPulse.js';

describe('payoutToastPendingReadyEntryPulse', () => {
  it('pulses only when payout pending glow newly becomes actionable', () => {
    expect(shouldPayoutToastPendingReadyEntryPulse(false, true)).toBe(true);
    expect(shouldPayoutToastPendingReadyEntryPulse(true, true)).toBe(false);
    expect(shouldPayoutToastPendingReadyEntryPulse(true, false)).toBe(false);
    expect(shouldPayoutToastPendingReadyEntryPulse(false, false)).toBe(false);
  });
});
