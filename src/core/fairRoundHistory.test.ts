import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FairRound } from './types.js';
import {
  clearFairRoundHistory,
  FAIR_ROUND_HISTORY_MAX,
  loadFairRoundHistory,
  persistFairRound,
} from './fairRoundHistory.js';

function makeRound(cycleId: number): FairRound {
  return {
    cycleId,
    serverSeed: 'a'.repeat(32),
    serverSeedHash: 'b'.repeat(64),
    clientSeed: 'guest',
    revealed: cycleId % 2 === 0,
  };
}

describe('fairRoundHistory', () => {
  beforeEach(async () => {
    await clearFairRoundHistory();
  });

  afterEach(async () => {
    await clearFairRoundHistory();
  });

  it('exports 48-round cap', () => {
    expect(FAIR_ROUND_HISTORY_MAX).toBe(48);
  });

  it('persists and loads rounds newest-first', async () => {
    await persistFairRound(makeRound(100));
    await persistFairRound(makeRound(102));
    await persistFairRound(makeRound(101));

    const history = await loadFairRoundHistory();
    expect(history).toHaveLength(3);
    expect(history[0]?.cycleId).toBe(102);
    expect(history[1]?.cycleId).toBe(101);
    expect(history[2]?.cycleId).toBe(100);
    expect(Object.isFrozen(history[0])).toBe(true);
  });

  it('updates existing cycleId on put', async () => {
    await persistFairRound(makeRound(200));
    await persistFairRound({ ...makeRound(200), revealed: true });

    const history = await loadFairRoundHistory();
    expect(history).toHaveLength(1);
    expect(history[0]?.revealed).toBe(true);
  });

  it('respects load limit', async () => {
    for (let i = 0; i < 5; i += 1) {
      await persistFairRound(makeRound(300 + i));
    }
    const limited = await loadFairRoundHistory(2);
    expect(limited).toHaveLength(2);
    expect(limited[0]?.cycleId).toBe(304);
  });

  it('clears all stored rounds', async () => {
    await persistFairRound(makeRound(400));
    await clearFairRoundHistory();
    expect(await loadFairRoundHistory()).toHaveLength(0);
  });

  it('prunes beyond FAIR_ROUND_HISTORY_MAX', async () => {
    const base = 10_000;
    for (let i = 0; i < FAIR_ROUND_HISTORY_MAX + 1; i += 1) {
      await persistFairRound(makeRound(base + i));
    }

    const history = await loadFairRoundHistory();
    expect(history).toHaveLength(FAIR_ROUND_HISTORY_MAX);
    expect(history[0]?.cycleId).toBe(base + FAIR_ROUND_HISTORY_MAX);
    expect(history.at(-1)?.cycleId).toBe(base + 1);
    expect(history.some((row) => row.cycleId === base)).toBe(false);
  });
});
