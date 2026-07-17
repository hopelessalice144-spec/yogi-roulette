import { describe, expect, it } from 'vitest';

import { shouldDrawerMetaEntryPulse } from './drawerMetaEntryPulse.js';



describe('drawerMetaEntryPulse', () => {

  it('pulses only when the staked total changes', () => {

    expect(shouldDrawerMetaEntryPulse(0, 25)).toBe(true);

    expect(shouldDrawerMetaEntryPulse(50, 75)).toBe(true);

    expect(shouldDrawerMetaEntryPulse(50, 50)).toBe(false);

  });

});

