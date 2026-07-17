/** Subtle favorites-toggle pulse when saved presets exist. */
export function shouldFavoritesPanelReadyGlow(favorites, expanded = false) {
  if (expanded === true) return false;
  return Array.isArray(favorites) && favorites.length > 0;
}
