import { describe, expect, it } from 'vitest';
import { betLockCountdown } from './betLockCountdown.js';

describe('betLockCountdown', () => {
  it('tracks remaining betting seconds until lock', () => {
    expect(betLockCountdown(0, 'betting')).toEqual({
      active: true,
      secondsLeft: 20,
      remaining: 1,
      urgent: false,
    });
    expect(betLockCountdown(15, 'betting')).toEqual({
      active: true,
      secondsLeft: 5,
      remaining: 0.25,
      urgent: true,
    });
    expect(betLockCountdown(19, 'betting')).toEqual({
      active: true,
      secondsLeft: 1,
      remaining: 0.05,
      urgent: true,
    });
  });

  it('is inactive outside the betting phase', () => {
    expect(betLockCountdown(22, 'locked')).toEqual({
      active: false,
      secondsLeft: 0,
      remaining: 0,
      urgent: false,
    });
    expect(betLockCountdown(27, 'spinning')).toEqual({
      active: false,
      secondsLeft: 0,
      remaining: 0,
      urgent: false,
    });
  });
});
