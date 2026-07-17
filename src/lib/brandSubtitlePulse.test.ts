import { describe, expect, it } from 'vitest';
import { shouldBrandSubtitlePulse } from './brandSubtitlePulse.js';

describe('brandSubtitlePulse', () => {
  it('pulses only when the UI theme changes', () => {
    expect(shouldBrandSubtitlePulse('lounge', 'neon')).toBe(true);
    expect(shouldBrandSubtitlePulse('neon', 'neon')).toBe(false);
    expect(shouldBrandSubtitlePulse('lounge', 'lounge')).toBe(false);
  });
});
