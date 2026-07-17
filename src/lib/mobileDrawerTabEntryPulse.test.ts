import { describe, expect, it } from 'vitest';

import { shouldMobileDrawerTabEntryPulse } from './mobileDrawerTabEntryPulse.js';



describe('mobileDrawerTabEntryPulse', () => {

  it('pulses only when the collapsed drawer tab becomes newly actionable', () => {

    expect(shouldMobileDrawerTabEntryPulse(false, true)).toBe(true);

    expect(shouldMobileDrawerTabEntryPulse(true, true)).toBe(false);

    expect(shouldMobileDrawerTabEntryPulse(true, false)).toBe(false);

    expect(shouldMobileDrawerTabEntryPulse(false, false)).toBe(false);

  });

});

