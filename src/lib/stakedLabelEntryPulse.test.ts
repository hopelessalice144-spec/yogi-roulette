import { describe, expect, it } from 'vitest';

import {
  shouldStakedLabelEntryPulse,
  stakedLabelEntryPulseKey,
} from './stakedLabelEntryPulse.js';



describe('stakedLabelEntryPulse', () => {

  it('pulses only when a stake commit key is active', () => {

    expect(shouldStakedLabelEntryPulse(0)).toBe(false);

    expect(shouldStakedLabelEntryPulse(2)).toBe(true);

  });



  it('builds a combined stake/batch entry pulse key', () => {

    expect(stakedLabelEntryPulseKey(0, 0)).toBeNull();

    expect(stakedLabelEntryPulseKey(3, 0)).toBe('staked-label-entry-3');

    expect(stakedLabelEntryPulseKey(1, 5)).toBe('staked-label-entry-5');

  });

});

