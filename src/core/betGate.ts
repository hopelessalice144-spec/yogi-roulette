/**
 * Atomic betting gate — wall-clock + phase dual validation.
 * Prevents race bets across async audio unlock and rapid double-tap.
 */

import { canPlaceBet, bettingLockTimestampMs } from './gameEngine.js';
import type { GameClock } from './types.js';

type BetClock = Pick<GameClock, 'acceptsBets' | 'cycleId'>;

/** Millisecond timestamp when betting closes for a cycle. */
export function bettingLockMs(cycleId: number, nowMs: number = Date.now()): number {
  return bettingLockTimestampMs(cycleId, nowMs);
}

/** Synchronous gate — true only when phase AND wall-clock allow bets. */
export function isBettingOpen(
  clock: BetClock | null | undefined,
  nowMs: number = Date.now()
): boolean {
  if (!clock || !canPlaceBet(clock)) return false;
  return nowMs < bettingLockTimestampMs(clock.cycleId, nowMs);
}

/** User-facing rejection reason, or null if betting is open. */
export function betRejectionReason(
  clock: BetClock | null | undefined,
  nowMs: number = Date.now()
): string | null {
  if (!clock) return 'Bets locked.';
  if (!canPlaceBet(clock)) return 'Bets locked.';
  if (nowMs >= bettingLockTimestampMs(clock.cycleId, nowMs)) return 'Bets locked.';
  return null;
}

export interface BetMutex {
  tryAcquire(): boolean;
  release(): void;
  readonly isLocked: boolean;
}

/** Lightweight mutex for concurrent async placeBet calls. */
export function createBetMutex(): BetMutex {
  let locked = false;
  return {
    tryAcquire(): boolean {
      if (locked) return false;
      locked = true;
      return true;
    },
    release(): void {
      locked = false;
    },
    get isLocked(): boolean {
      return locked;
    },
  };
}

const mockCycleId = 1_700_000_000;
const lockAt = bettingLockTimestampMs(mockCycleId);
const mockOpen = { acceptsBets: true, cycleId: mockCycleId };
console.assert(isBettingOpen(mockOpen, lockAt - 1), 'bet gate open before lock');
console.assert(!isBettingOpen(mockOpen, lockAt), 'bet gate closed at lock');
console.assert(!isBettingOpen({ acceptsBets: false, cycleId: 1 }, Date.now()), 'bet gate closed when phase locked');
const mutex = createBetMutex();
console.assert(mutex.tryAcquire() && !mutex.tryAcquire(), 'bet mutex excludes concurrent acquire');
mutex.release();
console.assert(mutex.tryAcquire(), 'bet mutex releases');
