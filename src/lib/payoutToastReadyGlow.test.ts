import { describe, expect, it } from 'vitest';
import { shouldPayoutToastReadyGlow } from './payoutToastReadyGlow.js';

describe('payoutToastReadyGlow', () => {
  it('glows only while a win burst is queued before reveal', () => {
    expect(shouldPayoutToastReadyGlow(120, null, 2, 1)).toBe(true);
    expect(shouldPayoutToastReadyGlow(120, 17, 2, 1)).toBe(false);
    expect(shouldPayoutToastReadyGlow(0, null, 2, 1)).toBe(false);
    expect(shouldPayoutToastReadyGlow(120, null, 2, 2)).toBe(false);
  });
});
