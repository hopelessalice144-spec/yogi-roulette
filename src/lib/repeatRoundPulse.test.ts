import { describe, expect, it } from 'vitest';
import { shouldRepeatRoundPulse } from './repeatRoundPulse.js';

describe('repeatRoundPulse', () => {
  it('pulses only when repeat restored bets', () => {
    expect(shouldRepeatRoundPulse([{ type: 'red', amount: 25 }])).toBe(true);
    expect(shouldRepeatRoundPulse([])).toBe(false);
    expect(shouldRepeatRoundPulse(null)).toBe(false);
  });
});
