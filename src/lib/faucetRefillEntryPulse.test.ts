import { describe, expect, it } from 'vitest';

import { shouldFaucetRefillEntryPulse } from './faucetRefillEntryPulse.js';

describe('faucetRefillEntryPulse', () => {
  it('pulses only when faucet granted funds', () => {
    expect(shouldFaucetRefillEntryPulse(true, 1000)).toBe(true);
    expect(shouldFaucetRefillEntryPulse(false, 1000)).toBe(false);
    expect(shouldFaucetRefillEntryPulse(true, 0)).toBe(false);
  });
});
