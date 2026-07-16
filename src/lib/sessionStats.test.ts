import { describe, expect, it } from 'vitest';
import {
  appendSessionRound,
  hotColdNumbers,
  plSeries,
  progressionAdvice,
  sessionTotals,
} from './sessionStats.js';

describe('sessionStats', () => {
  it('appends rounds with dedupe by cycle', () => {
    const one = appendSessionRound([], { cycleId: 1, number: 7, color: 'red', net: 50, risked: 25 });
    expect(one).toHaveLength(1);
    const two = appendSessionRound(one, { cycleId: 1, number: 8, color: 'black', net: -25, risked: 25 });
    expect(two).toHaveLength(1);
    expect(two[0].number).toBe(8);
  });

  it('computes hot and cold numbers', () => {
    const rounds = [
      { cycleId: 3, number: 7, net: 0, risked: 0 },
      { cycleId: 2, number: 7, net: 0, risked: 0 },
      { cycleId: 1, number: 1, net: 0, risked: 0 },
    ];
    const { hot, cold } = hotColdNumbers(rounds, 2);
    expect(hot[0]).toEqual({ number: 7, count: 2 });
    expect(cold[0].count).toBeLessThanOrEqual(hot[hot.length - 1].count);
  });

  it('builds cumulative P/L series', () => {
    const rounds = [
      { cycleId: 3, number: 5, net: 20, risked: 10 },
      { cycleId: 2, number: 2, net: -10, risked: 10 },
      { cycleId: 1, number: 9, net: 5, risked: 5 },
    ];
    const series = plSeries(rounds);
    expect(series.at(-1)?.cumulative).toBe(15);
  });

  it('summarizes session totals', () => {
    const totals = sessionTotals([
      { net: 30, risked: 10 },
      { net: -10, risked: 10 },
    ]);
    expect(totals.net).toBe(20);
    expect(totals.wins).toBe(1);
    expect(totals.losses).toBe(1);
  });

  it('suggests flat chip after a win', () => {
    const advice = progressionAdvice({
      rounds: [{ net: 25, risked: 25 }],
      chipValues: [1, 5, 25, 100],
      selectedChip: 25,
      balance: 500,
    });
    expect(advice.mode).toBe('flat');
    expect(advice.chip).toBe(25);
  });

  it('suggests step-up chip after a loss', () => {
    const advice = progressionAdvice({
      rounds: [{ net: -25, risked: 25 }],
      chipValues: [1, 5, 25, 100],
      selectedChip: 25,
      balance: 500,
    });
    expect(advice.mode).toBe('recover');
    expect(advice.chip).toBe(100);
  });
});
