import { describe, expect, it } from 'vitest';
import { parseCycleTick, RT_EVENTS, SYNC_MODES } from './rtProtocol.js';

describe('rtProtocol', () => {
  it('exports cycle sync constants', () => {
    expect(RT_EVENTS.CYCLE_TICK).toBe('cycle.tick');
    expect(RT_EVENTS.ROUND_COMMIT).toBe('round.commit');
    expect(RT_EVENTS.ROUND_REVEAL).toBe('round.reveal');
    expect(SYNC_MODES.WALL_CLOCK).toBe('wall-clock');
    expect(SYNC_MODES.AUTHORITATIVE_STREAM).toBe('authoritative-stream');
    expect(SYNC_MODES.AUTHORITATIVE_API).toBe('authoritative-api');
  });

  describe('parseCycleTick', () => {
    it('parses valid tick payload', () => {
      const tick = parseCycleTick({
        type: 'cycle.tick',
        nowMs: 1_700_000_000_000,
        cycleId: 42,
        cycleSecond: 7,
        name: 'betting',
        secondsRemaining: 23,
      });
      expect(tick).not.toBeNull();
      expect(tick?.cycleId).toBe(42);
      expect(tick?.cycleSecond).toBe(7);
      expect(tick?.name).toBe('betting');
      expect(tick?.secondsRemaining).toBe(23);
      expect(tick?.type).toBe('cycle.tick');
      expect(Object.isFrozen(tick)).toBe(true);
    });

    it('defaults type and phase', () => {
      const tick = parseCycleTick({ cycleId: 1, cycleSecond: 0 });
      expect(tick?.type).toBe(RT_EVENTS.CYCLE_TICK);
      expect(tick?.name).toBe('betting');
    });

    it('coerces unknown phase to betting', () => {
      const tick = parseCycleTick({ cycleId: 1, cycleSecond: 5, name: 'unknown' });
      expect(tick?.name).toBe('betting');
    });

    it('accepts locked and spinning phases', () => {
      expect(parseCycleTick({ cycleId: 1, cycleSecond: 22, name: 'locked' })?.name).toBe('locked');
      expect(parseCycleTick({ cycleId: 1, cycleSecond: 27, name: 'spinning' })?.name).toBe(
        'spinning'
      );
    });

    it('returns null for invalid input', () => {
      expect(parseCycleTick(null)).toBeNull();
      expect(parseCycleTick(undefined)).toBeNull();
      expect(parseCycleTick({ cycleId: NaN, cycleSecond: 5 })).toBeNull();
      expect(parseCycleTick({ cycleId: 1, cycleSecond: NaN })).toBeNull();
    });
  });
});
