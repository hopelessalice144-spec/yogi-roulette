import { describe, expect, it } from 'vitest';

import { shouldFavoritesPanelReadyEntryPulse } from './favoritesPanelReadyEntryPulse.js';

describe('favoritesPanelReadyEntryPulse', () => {
  it('pulses only when favorites toggle newly becomes actionable', () => {
    expect(shouldFavoritesPanelReadyEntryPulse(false, true)).toBe(true);
    expect(shouldFavoritesPanelReadyEntryPulse(true, true)).toBe(false);
    expect(shouldFavoritesPanelReadyEntryPulse(true, false)).toBe(false);
    expect(shouldFavoritesPanelReadyEntryPulse(false, false)).toBe(false);
  });
});
