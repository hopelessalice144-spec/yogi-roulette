import { describe, expect, it } from 'vitest';
import { integrityDigest } from './integrityDigest.js';

describe('integrityDigest', () => {
  it('returns a 64-character lowercase hex digest', () => {
    const digest = integrityDigest('wallet');
    expect(digest).toHaveLength(64);
    expect(digest).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic for the same payload', () => {
    const payload = 'balance:1000';
    expect(integrityDigest(payload)).toBe(integrityDigest(payload));
  });

  it('changes when payload changes', () => {
    expect(integrityDigest('alpha')).not.toBe(integrityDigest('beta'));
  });

  it('matches stable salted SHA-256 vectors', () => {
    expect(integrityDigest('test')).toBe(
      '35088de396eec53f41fb87fabcc677ee86b7193510669628f86cbed231f466cc',
    );
    expect(integrityDigest('wallet')).toBe(
      '02f53bcd7a72c65ead91002187ae012c6a21a3b4a34116285d661f2cb377bf9f',
    );
    expect(integrityDigest('')).toBe(
      '4546295c9bc9a2bd033999b93aee9f0c12b9ebde0729a64375ca86b96105cf1d',
    );
  });
});
