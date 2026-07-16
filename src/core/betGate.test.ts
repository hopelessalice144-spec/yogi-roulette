import { describe, expect, it } from 'vitest';
import {
  betRejectionReason,
  bettingLockMs,
  createBetMutex,
  isBettingOpen,
} from './betGate.js';

const GATE_CYCLE = 1_700_000_000;

describe('betGate', () => {
  const lockAt = bettingLockMs(GATE_CYCLE);
  const openClock = { acceptsBets: true, cycleId: GATE_CYCLE };

  it('computes lock timestamp from cycleId', () => {
    expect(lockAt).toBe((GATE_CYCLE * 30 + 20) * 1000);
  });

  it('opens 1ms before lock', () => {
    expect(isBettingOpen(openClock, lockAt - 1)).toBe(true);
    expect(betRejectionReason(openClock, lockAt - 1)).toBeNull();
  });

  it('closes at lock ms', () => {
    expect(isBettingOpen(openClock, lockAt)).toBe(false);
    expect(betRejectionReason(openClock, lockAt)).toBe('Bets locked.');
  });

  it('closes when phase rejects bets', () => {
    const locked = { acceptsBets: false, cycleId: GATE_CYCLE };
    expect(isBettingOpen(locked, lockAt - 1)).toBe(false);
    expect(betRejectionReason(locked, lockAt - 1)).toBe('Bets locked.');
  });

  it('closes when clock is null', () => {
    expect(isBettingOpen(null)).toBe(false);
    expect(betRejectionReason(null)).toBe('Bets locked.');
  });

  it('serializes concurrent acquire via mutex', () => {
    const mutex = createBetMutex();
    expect(mutex.isLocked).toBe(false);
    expect(mutex.tryAcquire()).toBe(true);
    expect(mutex.isLocked).toBe(true);
    expect(mutex.tryAcquire()).toBe(false);
    mutex.release();
    expect(mutex.isLocked).toBe(false);
    expect(mutex.tryAcquire()).toBe(true);
  });
});
