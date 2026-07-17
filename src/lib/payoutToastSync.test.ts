import { describe, expect, it } from 'vitest';
import {
  PAYOUT_TOAST_SYNC_OFFSET_MS,
  payoutToastSyncDelayMs,
  shouldSyncPayoutToast,
} from './payoutToastSync.js';

describe('payoutToastSync', () => {
  it('waits for settle reveal with a winning payout', () => {
    expect(shouldSyncPayoutToast(120, 17, 'settle-reveal')).toBe(true);
    expect(shouldSyncPayoutToast(0, 17, 'settle-reveal')).toBe(false);
    expect(shouldSyncPayoutToast(120, 17, 'spin-focus')).toBe(false);
  });

  it('exports sync offset aligned to result pill fly-in', () => {
    expect(payoutToastSyncDelayMs()).toBe(PAYOUT_TOAST_SYNC_OFFSET_MS);
    expect(payoutToastSyncDelayMs(0)).toBe(0);
  });
});
