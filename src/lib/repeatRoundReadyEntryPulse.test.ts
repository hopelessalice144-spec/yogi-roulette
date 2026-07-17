import { describe, expect, it } from 'vitest';

import { shouldRepeatRoundReadyEntryPulse } from './repeatRoundReadyEntryPulse.js';

describe('repeatRoundReadyEntryPulse', () => {
  it('pulses only when repeat newly becomes actionable', () => {
    expect(shouldRepeatRoundReadyEntryPulse(false, true)).toBe(true);
    expect(shouldRepeatRoundReadyEntryPulse(true, true)).toBe(false);
    expect(shouldRepeatRoundReadyEntryPulse(true, false)).toBe(false);
    expect(shouldRepeatRoundReadyEntryPulse(false, false)).toBe(false);
  });
});
