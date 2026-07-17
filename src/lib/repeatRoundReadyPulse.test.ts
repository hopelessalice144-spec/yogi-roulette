import { describe, expect, it } from 'vitest';
import { shouldRepeatRoundReadyPulse } from './repeatRoundReadyPulse.js';

describe('repeatRoundReadyPulse', () => {
  it('pulses only when repeat becomes newly available', () => {
    expect(shouldRepeatRoundReadyPulse(false, true)).toBe(true);
    expect(shouldRepeatRoundReadyPulse(true, true)).toBe(false);
    expect(shouldRepeatRoundReadyPulse(true, false)).toBe(false);
    expect(shouldRepeatRoundReadyPulse(false, false)).toBe(false);
  });
});
