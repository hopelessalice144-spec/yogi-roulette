import { describe, expect, it } from 'vitest';
import { shouldFaucetReadyGlow } from './faucetReadyGlow.js';

describe('faucetReadyGlow', () => {
  it('glows only at or below faucet trigger balance', () => {
    expect(shouldFaucetReadyGlow(0)).toBe(true);
    expect(shouldFaucetReadyGlow(-5)).toBe(true);
    expect(shouldFaucetReadyGlow(1)).toBe(false);
    expect(shouldFaucetReadyGlow(500)).toBe(false);
  });

  it('suppresses glow during security hold', () => {
    expect(shouldFaucetReadyGlow(0, { securityFrozen: true })).toBe(false);
  });
});
