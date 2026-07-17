import { describe, expect, it } from 'vitest';
import { shouldFaucetRefillPulse } from './faucetRefillPulse.js';

describe('faucetRefillPulse', () => {
  it('pulses only when faucet granted funds', () => {
    expect(shouldFaucetRefillPulse(true, 1000)).toBe(true);
    expect(shouldFaucetRefillPulse(false, 1000)).toBe(false);
    expect(shouldFaucetRefillPulse(true, 0)).toBe(false);
  });
});
