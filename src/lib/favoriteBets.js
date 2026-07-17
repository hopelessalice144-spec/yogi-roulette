/**
 * Saved favorite bet presets — localStorage persistence.
 */

import { sanitizeBets, MAX_TOTAL_STAKED } from './betSchema.js';
import { totalStaked } from './bets.js';
import { assertPlainText } from './domSanitize.js';

const FAVORITES_KEY = 'turboRoulette.favoriteBets';
export const MAX_FAVORITES = 10;
const MAX_NAME_LEN = 28;

function normalizeName(name) {
  const trimmed = String(name ?? '').trim().slice(0, MAX_NAME_LEN);
  if (!trimmed || !assertPlainText(trimmed)) return null;
  return trimmed;
}

function normalizeFavorite(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const name = normalizeName(raw.name);
  const bets = sanitizeBets(raw.bets);
  if (!name || bets.length === 0) return null;
  const id = String(raw.id ?? `fav-${Date.now().toString(36)}`).slice(0, 40);
  return {
    id,
    name,
    bets,
    total: totalStaked(bets),
    savedAt: Number.isFinite(raw.savedAt) ? raw.savedAt : Date.now(),
  };
}

export function loadFavorites() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeFavorite).filter(Boolean).slice(0, MAX_FAVORITES);
  } catch {
    return [];
  }
}

export function saveFavorites(favorites) {
  if (typeof localStorage === 'undefined') return;
  try {
    const safe = favorites
      .map(normalizeFavorite)
      .filter(Boolean)
      .slice(0, MAX_FAVORITES);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(safe));
  } catch {
    /* quota / private mode */
  }
}

export function createFavorite(name, bets) {
  const safeName = normalizeName(name);
  const safeBets = sanitizeBets(bets);
  if (!safeName || safeBets.length === 0) return null;
  if (totalStaked(safeBets) > MAX_TOTAL_STAKED) return null;
  return {
    id: `fav-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: safeName,
    bets: safeBets,
    total: totalStaked(safeBets),
    savedAt: Date.now(),
  };
}

export function addFavorite(favorites, name, bets) {
  const entry = createFavorite(name, bets);
  if (!entry) return favorites;
  const next = [entry, ...favorites.filter((f) => f.id !== entry.id)];
  if (next.length > MAX_FAVORITES) next.length = MAX_FAVORITES;
  saveFavorites(next);
  return next;
}

export function removeFavorite(favorites, id) {
  const next = favorites.filter((f) => f.id !== id);
  saveFavorites(next);
  return next;
}

/** Short summary for preset list rows. */
export function favoriteSummary(favorite) {
  const n = favorite?.bets?.length ?? 0;
  const total = favorite?.total ?? totalStaked(favorite?.bets ?? []);
  return `${n} bet${n === 1 ? '' : 's'} · $${total}`;
}
