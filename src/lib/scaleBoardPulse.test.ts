import { describe, expect, it } from 'vitest';
import { scaleBoardPulseMode, shouldScaleBoardPulse } from './scaleBoardPulse.js';

describe('scaleBoardPulse', () => {
  it('pulses only when scaled bets were committed', () => {
    expect(shouldScaleBoardPulse([{ type: 'straight', value: 7, amount: 10 }])).toBe(true);
    expect(shouldScaleBoardPulse([])).toBe(false);
    expect(shouldScaleBoardPulse(null)).toBe(false);
  });

  it('maps scale factor to half or double mode', () => {
    expect(scaleBoardPulseMode(0.5)).toBe('half');
    expect(scaleBoardPulseMode(2)).toBe('double');
    expect(scaleBoardPulseMode(1)).toBe(null);
  });
});
