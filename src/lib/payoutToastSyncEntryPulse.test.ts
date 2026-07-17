import { describe, expect, it } from 'vitest';
import { shouldPayoutToastSyncEntryPulse } from './payoutToastSyncEntryPulse.js';

describe('payoutToastSyncEntryPulse', () => {
  it('pulses only when a new synced payout toast is added', () => {
    expect(shouldPayoutToastSyncEntryPulse(0, 1)).toBe(true);
    expect(shouldPayoutToastSyncEntryPulse(1, 2)).toBe(true);
    expect(shouldPayoutToastSyncEntryPulse(2, 2)).toBe(false);
    expect(shouldPayoutToastSyncEntryPulse(2, 1)).toBe(false);
    expect(shouldPayoutToastSyncEntryPulse(0, 0)).toBe(false);
  });
});
