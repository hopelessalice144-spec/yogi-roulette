import { describe, expect, it } from 'vitest';
import { shouldFavoritesPanelReadyPulse } from './favoritesPanelReadyPulse.js';

describe('favoritesPanelReadyPulse', () => {
  it('pulses only when favorites become newly available', () => {
    expect(shouldFavoritesPanelReadyPulse(false, true)).toBe(true);
    expect(shouldFavoritesPanelReadyPulse(true, true)).toBe(false);
    expect(shouldFavoritesPanelReadyPulse(true, false)).toBe(false);
    expect(shouldFavoritesPanelReadyPulse(false, false)).toBe(false);
  });
});
