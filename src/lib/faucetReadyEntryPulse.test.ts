import { describe, expect, it } from 'vitest';

import { shouldFaucetReadyEntryPulse } from './faucetReadyEntryPulse.js';

describe('faucetReadyEntryPulse', () => {
  it('pulses only when faucet newly becomes actionable', () => {
    expect(shouldFaucetReadyEntryPulse(false, true)).toBe(true);
    expect(shouldFaucetReadyEntryPulse(true, true)).toBe(false);
    expect(shouldFaucetReadyEntryPulse(true, false)).toBe(false);
    expect(shouldFaucetReadyEntryPulse(false, false)).toBe(false);
  });
});
