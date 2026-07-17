import { describe, expect, it } from 'vitest';
import { shouldFavoritesPanelReadyGlow } from './favoritesPanelReadyGlow.js';

describe('favoritesPanelReadyGlow', () => {
  it('glows when presets exist and the panel is collapsed', () => {
    expect(shouldFavoritesPanelReadyGlow([{ id: 'a' }], false)).toBe(true);
    expect(shouldFavoritesPanelReadyGlow([{ id: 'a' }], true)).toBe(false);
    expect(shouldFavoritesPanelReadyGlow([], false)).toBe(false);
  });
});
