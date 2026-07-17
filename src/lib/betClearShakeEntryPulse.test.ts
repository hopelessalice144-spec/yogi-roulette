import { describe, expect, it } from 'vitest';

import { shouldBetClearShakeEntryPulse } from './betClearShakeEntryPulse.js';

describe('betClearShakeEntryPulse', () => {
  it('shakes only when chips were refunded', () => {
    expect(shouldBetClearShakeEntryPulse(50)).toBe(true);
    expect(shouldBetClearShakeEntryPulse(0)).toBe(false);
    expect(shouldBetClearShakeEntryPulse(-10)).toBe(false);
  });
});
