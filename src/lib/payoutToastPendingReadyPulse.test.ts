import { describe, expect, it } from 'vitest';
import { shouldPayoutToastPendingReadyPulse } from './payoutToastPendingReadyPulse.js';

describe('payoutToastPendingReadyPulse', () => {
  it('pulses only when pending payout glow becomes newly eligible', () => {
    expect(shouldPayoutToastPendingReadyPulse(false, true)).toBe(true);
    expect(shouldPayoutToastPendingReadyPulse(true, true)).toBe(false);
    expect(shouldPayoutToastPendingReadyPulse(true, false)).toBe(false);
    expect(shouldPayoutToastPendingReadyPulse(false, false)).toBe(false);
  });
});
