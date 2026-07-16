import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const timer = vi.hoisted(() => ({
  getPhase: vi.fn(),
  getCycleId: vi.fn(),
  getSecondsToBallDrop: vi.fn(),
}));

const react = vi.hoisted(() => {
  let state: unknown;
  const setState = vi.fn((next: unknown) => {
    state = next;
  });
  let effectCleanup: (() => void) | null = null;

  return {
    setState,
    getState: () => state,
    useState: (init: unknown) => {
      state = typeof init === 'function' ? (init as () => unknown)() : init;
      return [state, setState];
    },
    useEffect: (cb: () => void | (() => void)) => {
      effectCleanup?.();
      effectCleanup = cb() ?? null;
    },
    runCleanup: () => {
      effectCleanup?.();
      effectCleanup = null;
    },
    reset: () => {
      state = undefined;
      setState.mockClear();
      effectCleanup?.();
      effectCleanup = null;
    },
  };
});

vi.mock('@core/timer.js', () => timer);
vi.mock('react', () => ({
  useState: react.useState,
  useEffect: react.useEffect,
}));

import { useLiveClock } from './useLiveClock.js';

describe('useLiveClock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    react.reset();
    timer.getPhase.mockReturnValue({
      name: 'betting',
      cycleSecond: 5,
      secondsRemaining: 25,
    });
    timer.getCycleId.mockReturnValue(100);
    timer.getSecondsToBallDrop.mockReturnValue(20);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('returns an initial snapshot merged from timer helpers', () => {
    const snapshot = useLiveClock();
    expect(snapshot).toEqual({
      name: 'betting',
      cycleSecond: 5,
      secondsRemaining: 25,
      cycleId: 100,
      tMinus: 20,
    });
    expect(timer.getPhase).toHaveBeenCalled();
    expect(timer.getCycleId).toHaveBeenCalled();
    expect(timer.getSecondsToBallDrop).toHaveBeenCalled();
  });

  it('refreshes the snapshot on each interval tick', () => {
    useLiveClock(200);
    timer.getPhase.mockReturnValue({
      name: 'locked',
      cycleSecond: 22,
      secondsRemaining: 8,
    });
    timer.getCycleId.mockReturnValue(101);
    timer.getSecondsToBallDrop.mockReturnValue(3);

    vi.advanceTimersByTime(200);

    expect(react.setState).toHaveBeenCalledWith({
      name: 'locked',
      cycleSecond: 22,
      secondsRemaining: 8,
      cycleId: 101,
      tMinus: 3,
    });
  });

  it('honors a custom polling interval', () => {
    const spy = vi.spyOn(globalThis, 'setInterval');
    useLiveClock(500);
    expect(spy).toHaveBeenCalledWith(expect.any(Function), 500);
    spy.mockRestore();
  });

  it('clears the interval when the effect cleans up', () => {
    const setSpy = vi.spyOn(globalThis, 'setInterval');
    const clearSpy = vi.spyOn(globalThis, 'clearInterval');
    useLiveClock();
    const intervalId = setSpy.mock.results.at(-1)?.value as number;
    react.runCleanup();
    expect(clearSpy).toHaveBeenCalledWith(intervalId);
    setSpy.mockRestore();
    clearSpy.mockRestore();
  });
});
