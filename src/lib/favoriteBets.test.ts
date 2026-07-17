import { describe, expect, it } from 'vitest';
import {
  addFavorite,
  createFavorite,
  favoriteSummary,
  loadFavorites,
  removeFavorite,
} from './favoriteBets.js';

describe('favoriteBets', () => {
  it('creates and summarizes a preset', () => {
    const fav = createFavorite('Lucky 7', [{ type: 'straight', value: 7, amount: 25 }]);
    expect(fav?.name).toBe('Lucky 7');
    expect(fav?.total).toBe(25);
    expect(favoriteSummary(fav)).toBe('1 bet · $25');
  });

  it('adds and removes favorites', () => {
    const base = loadFavorites();
    const withFav = addFavorite(base, 'Red stack', [{ type: 'red', amount: 5 }]);
    expect(withFav.length).toBeGreaterThanOrEqual(base.length);
    const id = withFav[0]?.id;
    expect(id).toBeTruthy();
    const trimmed = removeFavorite(withFav, id);
    expect(trimmed.find((entry: { id: string }) => entry.id === id)).toBeUndefined();
  });
});
