import { describe, expect, it } from 'vitest';

import { shouldFavoriteApplyEntryPulse } from './favoriteApplyEntryPulse.js';



describe('favoriteApplyEntryPulse', () => {

  it('pulses only when a favorite apply key is active', () => {

    expect(shouldFavoriteApplyEntryPulse(0)).toBe(false);

    expect(shouldFavoriteApplyEntryPulse(2)).toBe(true);

  });

});

