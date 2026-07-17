import { describe, expect, it } from 'vitest';

import { shouldBrandSubtitleEntryPulse } from './brandSubtitleEntryPulse.js';

describe('brandSubtitleEntryPulse', () => {
  it('pulses only when the UI theme changes', () => {
    expect(shouldBrandSubtitleEntryPulse('lounge', 'neon')).toBe(true);
    expect(shouldBrandSubtitleEntryPulse('neon', 'neon')).toBe(false);
    expect(shouldBrandSubtitleEntryPulse('lounge', 'lounge')).toBe(false);
  });
});
