export const FAVORITE_HOTKEY_SLOTS = 3;

/** Most-recent presets first — matches FavoriteBetsPanel list order. */
export function sortedFavoritesForHotkeys(favorites = []) {
  return [...favorites].sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0));
}

/** F1–F3 → slot index 0–2, or -1 when not a favorite hotkey. */
export function favoriteHotkeyIndex(event) {
  if (!event || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
    return -1;
  }
  if (event.target?.closest?.('input, textarea, select, [contenteditable="true"]')) {
    return -1;
  }
  const match = /^F([1-3])$/.exec(event.key);
  if (!match) return -1;
  return Number(match[1]) - 1;
}

export function favoriteForHotkey(favorites, index) {
  if (!Number.isInteger(index) || index < 0 || index >= FAVORITE_HOTKEY_SLOTS) return null;
  return sortedFavoritesForHotkeys(favorites)[index] ?? null;
}

/** Label map for shortcuts overlay — e.g. F1=Red split. */
export function favoriteHotkeyLabels(favorites = []) {
  const sorted = sortedFavoritesForHotkeys(favorites);
  return Array.from({ length: FAVORITE_HOTKEY_SLOTS }, (_, index) => {
    const fav = sorted[index];
    return fav ? `F${index + 1}=${fav.name}` : `F${index + 1}=—`;
  });
}
