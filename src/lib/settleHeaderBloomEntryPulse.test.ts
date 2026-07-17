import { describe, expect, it } from 'vitest';
import { shouldSettleHeaderBloomEntryPulse } from './settleHeaderBloomEntryPulse.js';

describe('settleHeaderBloomEntryPulse', () => {
  it('pulses only when settle header bloom key newly activates', () => {
    expect(shouldSettleHeaderBloomEntryPulse(null, 'header-bloom-17')).toBe(true);
    expect(shouldSettleHeaderBloomEntryPulse('header-bloom-17', 'header-bloom-24')).toBe(true);
    expect(shouldSettleHeaderBloomEntryPulse('header-bloom-17', 'header-bloom-17')).toBe(false);
    expect(shouldSettleHeaderBloomEntryPulse('header-bloom-17', null)).toBe(false);
    expect(shouldSettleHeaderBloomEntryPulse(null, null)).toBe(false);
  });
});
