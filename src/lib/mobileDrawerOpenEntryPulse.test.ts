import { describe, expect, it } from 'vitest';

import { shouldMobileDrawerOpenEntryPulse } from './mobileDrawerOpenEntryPulse.js';



describe('mobileDrawerOpenEntryPulse', () => {

  it('pulses only when the mobile drawer newly opens', () => {

    expect(shouldMobileDrawerOpenEntryPulse(false, true)).toBe(true);

    expect(shouldMobileDrawerOpenEntryPulse(true, true)).toBe(false);

    expect(shouldMobileDrawerOpenEntryPulse(true, false)).toBe(false);

    expect(shouldMobileDrawerOpenEntryPulse(false, false)).toBe(false);

  });

});

