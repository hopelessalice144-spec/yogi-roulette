import { describe, expect, it } from 'vitest';

import { shouldMobileDrawerCollapseEntryPulse } from './mobileDrawerCollapseEntryPulse.js';



describe('mobileDrawerCollapseEntryPulse', () => {

  it('pulses only when the mobile drawer newly collapses', () => {

    expect(shouldMobileDrawerCollapseEntryPulse(false, true)).toBe(true);

    expect(shouldMobileDrawerCollapseEntryPulse(true, true)).toBe(false);

    expect(shouldMobileDrawerCollapseEntryPulse(true, false)).toBe(false);

    expect(shouldMobileDrawerCollapseEntryPulse(false, false)).toBe(false);

  });

});

