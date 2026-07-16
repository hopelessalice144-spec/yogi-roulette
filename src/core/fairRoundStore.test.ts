import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { commitServerSeed, deriveWinningNumber } from './provablyFair.js';
import {
  applyRemoteReveal,
  clearFairRounds,
  ensureRound,
  isRemoteAuthorityCycle,
  listFairRoundHistory,
  outcomeForCycle,
  publicRoundCommit,
  registerRemoteCommit,
  restoreStoredFairnessAudit,
  revealRound,
} from './fairRoundStore.js';

const CLIENT_SEED = 'test-client-seed';

function mockLocalStorage(): void {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  });
}

describe('fairRoundStore', () => {
  beforeEach(() => {
    clearFairRounds();
    mockLocalStorage();
  });

  afterEach(() => {
    clearFairRounds();
    vi.unstubAllGlobals();
  });

  it('commits round with 64-char hash', () => {
    const round = ensureRound(1001, CLIENT_SEED);
    expect(round.cycleId).toBe(1001);
    expect(round.serverSeedHash).toHaveLength(64);
    expect(round.revealed).toBe(false);
  });

  it('exposes public commit without server seed', () => {
    const commit = publicRoundCommit(1002);
    expect(commit.cycleId).toBe(1002);
    expect(commit.serverSeedHash).toHaveLength(64);
    expect(commit.clientSeed).toBeTruthy();
    expect('serverSeed' in commit).toBe(false);
  });

  it('derives deterministic outcome for cycle', () => {
    const round = ensureRound(1003, CLIENT_SEED);
    const outcome = outcomeForCycle(1003);
    expect(outcome).toBe(deriveWinningNumber(round.serverSeed, round.clientSeed, 1003));
    expect(outcome).toBeGreaterThanOrEqual(0);
    expect(outcome).toBeLessThan(37);
  });

  it('reveals verified audit', () => {
    const outcome = outcomeForCycle(1004);
    const audit = revealRound(1004, outcome);
    expect(audit.verified).toBe(true);
    expect(audit.winningNumber).toBe(outcome);
    expect(listFairRoundHistory()[0]?.revealed).toBe(true);
  });

  it('lists history newest-first', () => {
    revealRound(1010, outcomeForCycle(1010));
    revealRound(1011, outcomeForCycle(1011));
    const history = listFairRoundHistory();
    expect(history[0]?.cycleId).toBe(1011);
    expect(history[1]?.cycleId).toBe(1010);
  });

  it('handles remote commit and reveal', () => {
    const seed = 'e'.repeat(32);
    const hash = commitServerSeed(seed);
    registerRemoteCommit(2001, { serverSeedHash: hash, clientSeed: 'guest' });
    expect(isRemoteAuthorityCycle(2001)).toBe(true);

    const expected = deriveWinningNumber(seed, 'guest', 2001);
    const audit = applyRemoteReveal(2001, {
      serverSeed: seed,
      winningNumber: expected,
      serverSeedHash: hash,
    });
    expect(audit.verified).toBe(true);
    expect(outcomeForCycle(2001)).toBe(expected);
  });

  it('blocks outcome while remote reveal is pending', () => {
    const hash = commitServerSeed('f'.repeat(32));
    registerRemoteCommit(2002, { serverSeedHash: hash, clientSeed: 'guest' });
    ensureRound(2002);
    expect(() => outcomeForCycle(2002)).toThrow('Remote authority outcome not yet available');
  });

  it('restores verified audit for current cycle after reveal', () => {
    const outcome = outcomeForCycle(3001);
    revealRound(3001, outcome);
    const restored = restoreStoredFairnessAudit(3001);
    expect(restored?.verified).toBe(true);
    expect(restored?.cycleId).toBe(3001);
  });

  it('restores prior revealed cycle when current is unrevealed', () => {
    revealRound(3002, outcomeForCycle(3002));
    ensureRound(3003, CLIENT_SEED);
    const restored = restoreStoredFairnessAudit(3003);
    expect(restored?.verified).toBe(true);
    expect(restored?.cycleId).toBe(3002);
  });

  it('returns null when no revealed rounds exist', () => {
    ensureRound(3004, CLIENT_SEED);
    expect(restoreStoredFairnessAudit(3004)).toBeNull();
  });

  it('clears in-memory state', () => {
    ensureRound(3005, CLIENT_SEED);
    clearFairRounds();
    expect(listFairRoundHistory()).toHaveLength(0);
    expect(isRemoteAuthorityCycle(3005)).toBe(false);
  });
});
