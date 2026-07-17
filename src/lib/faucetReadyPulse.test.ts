import { describe, expect, it } from 'vitest';
import { shouldFaucetReadyPulse } from './faucetReadyPulse.js';

describe('faucetReadyPulse', () => {
  it('pulses only when faucet becomes newly eligible', () => {
    expect(shouldFaucetReadyPulse(false, true)).toBe(true);
    expect(shouldFaucetReadyPulse(true, true)).toBe(false);
    expect(shouldFaucetReadyPulse(true, false)).toBe(false);
    expect(shouldFaucetReadyPulse(false, false)).toBe(false);
  });
});
