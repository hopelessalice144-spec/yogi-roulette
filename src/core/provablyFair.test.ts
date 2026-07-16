import { describe, expect, it } from 'vitest';
import {
  buildFairnessAudit,
  commitServerSeed,
  deriveWinningNumber,
  normalizeClientSeed,
  verifyRound,
} from './provablyFair.js';

const DEMO_SEED = 'a'.repeat(32);

describe('provablyFair', () => {
  it('commits server seed to deterministic hash', () => {
    const hash = commitServerSeed(DEMO_SEED);
    expect(hash).toHaveLength(64);
    expect(commitServerSeed(DEMO_SEED)).toBe(hash);
  });

  it('rejects short server seeds', () => {
    expect(() => commitServerSeed('short')).toThrow(RangeError);
  });

  it('derives pocket in 0–36 range', () => {
    const n = deriveWinningNumber(DEMO_SEED, 'guest', 42);
    expect(n).toBeGreaterThanOrEqual(0);
    expect(n).toBeLessThan(37);
  });

  it('is deterministic for same inputs', () => {
    const a = deriveWinningNumber(DEMO_SEED, 'guest', 7);
    const b = deriveWinningNumber(DEMO_SEED, 'guest', 7);
    expect(a).toBe(b);
  });

  it('varies with cycleId', () => {
    const a = deriveWinningNumber(DEMO_SEED, 'guest', 1);
    const b = deriveWinningNumber(DEMO_SEED, 'guest', 2);
    expect(a).not.toBe(b);
  });

  it('rejects negative cycleId', () => {
    expect(() => deriveWinningNumber(DEMO_SEED, 'guest', -1)).toThrow(RangeError);
  });

  it('verifies a valid round', () => {
    const hash = commitServerSeed(DEMO_SEED);
    const winning = deriveWinningNumber(DEMO_SEED, 'guest', 42);
    expect(verifyRound(DEMO_SEED, hash, 'guest', 42, winning)).toBe(true);
  });

  it('rejects tampered hash', () => {
    const winning = deriveWinningNumber(DEMO_SEED, 'guest', 42);
    expect(verifyRound(DEMO_SEED, 'f'.repeat(64), 'guest', 42, winning)).toBe(false);
  });

  it('rejects wrong winning number', () => {
    const hash = commitServerSeed(DEMO_SEED);
    const winning = deriveWinningNumber(DEMO_SEED, 'guest', 42);
    const wrong = (winning + 1) % 37;
    expect(verifyRound(DEMO_SEED, hash, 'guest', 42, wrong)).toBe(false);
  });

  it('normalizes client seed', () => {
    expect(normalizeClientSeed('  alice  ')).toBe('alice');
    expect(normalizeClientSeed('')).toBe('guest');
    expect(normalizeClientSeed(null)).toBe('guest');
  });

  it('builds frozen audit with verified flag', () => {
    const hash = commitServerSeed(DEMO_SEED);
    const audit = buildFairnessAudit({
      serverSeed: DEMO_SEED,
      serverSeedHash: hash,
      clientSeed: 'guest',
      cycleId: 99,
    });
    expect(audit.verified).toBe(true);
    expect(audit.winningNumber).toBe(deriveWinningNumber(DEMO_SEED, 'guest', 99));
    expect(Object.isFrozen(audit)).toBe(true);
  });
});
