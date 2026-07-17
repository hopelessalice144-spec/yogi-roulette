import { describe, expect, it } from 'vitest';
import { buildPresentationResync } from './presentationResync.js';

describe('presentationResync', () => {
  it('preserves wheel angle on soft resync', () => {
    const clock = { name: 'betting' as const, cycleSecond: 8, nowMs: 1_000_000_000 };
    const result = buildPresentationResync({
      clockSnap: clock,
      wheelAngle: 1.25,
      wheelSpinSpeed: 0.42,
      syncWheel: false,
    });
    expect(result.wheelAngle).toBe(1.25);
    expect(result.syncWheel).toBe(false);
    expect(result.kinematic.phase).toBe('orbit');
  });

  it('recomputes wheel angle on hard resync', () => {
    const clock = { name: 'betting' as const, cycleSecond: 8, nowMs: 1_000_000_000 };
    const soft = buildPresentationResync({
      clockSnap: clock,
      wheelAngle: 1.25,
      wheelSpinSpeed: 0.42,
      syncWheel: false,
    });
    const hard = buildPresentationResync({
      clockSnap: clock,
      wheelAngle: 1.25,
      wheelSpinSpeed: 0.42,
      syncWheel: true,
    });
    expect(hard.syncWheel).toBe(true);
    expect(hard.wheelAngle).not.toBe(soft.wheelAngle);
  });
});
