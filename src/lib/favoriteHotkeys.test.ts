import { describe, expect, it } from 'vitest';
import {
  FAVORITE_HOTKEY_SLOTS,
  favoriteForHotkey,
  favoriteHotkeyIndex,
  favoriteHotkeyLabels,
  sortedFavoritesForHotkeys,
} from './favoriteHotkeys.js';

const favorites = [
  { id: 'a', name: 'Older', bets: [{ type: 'red', amount: 10 }], savedAt: 100 },
  { id: 'b', name: 'Newest', bets: [{ type: 'black', amount: 5 }], savedAt: 300 },
  { id: 'c', name: 'Middle', bets: [{ type: 'even', amount: 15 }], savedAt: 200 },
];

describe('favoriteHotkeys', () => {
  it('sorts favorites by savedAt descending for hotkey slots', () => {
    expect(sortedFavoritesForHotkeys(favorites).map((f) => f.name)).toEqual([
      'Newest',
      'Middle',
      'Older',
    ]);
  });

  it('maps F1–F3 to slot indices and ignores other keys', () => {
    expect(favoriteHotkeyIndex({ key: 'F1' })).toBe(0);
    expect(favoriteHotkeyIndex({ key: 'F3' })).toBe(2);
    expect(favoriteHotkeyIndex({ key: 'F4' })).toBe(-1);
    expect(favoriteHotkeyIndex({ key: 'F1', ctrlKey: true })).toBe(-1);
  });

  it('resolves preset for each hotkey slot', () => {
    expect(favoriteForHotkey(favorites, 0)?.name).toBe('Newest');
    expect(favoriteForHotkey(favorites, 2)?.name).toBe('Older');
    expect(favoriteForHotkey(favorites, 3)).toBeNull();
  });

  it('builds overlay labels with empty slots', () => {
    expect(favoriteHotkeyLabels([favorites[1]])).toEqual([
      'F1=Newest',
      'F2=—',
      'F3=—',
    ]);
    expect(FAVORITE_HOTKEY_SLOTS).toBe(3);
  });
});
