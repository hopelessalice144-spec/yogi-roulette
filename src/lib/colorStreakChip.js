import { colorStreak } from './sessionStats.js';

export const MIN_COLOR_STREAK_HIGHLIGHT = 3;
export const HOT_COLOR_STREAK = 5;

export function colorStreakTier(length) {
  if (length < MIN_COLOR_STREAK_HIGHLIGHT) return 'none';
  if (length >= HOT_COLOR_STREAK) return 'hot';
  return 'warm';
}

/** Active color run metadata for recent-results rail highlighting. */
export function colorStreakRun(recentResults) {
  const { color, length } = colorStreak(recentResults);
  const tier = colorStreakTier(length);
  const highlightCount = tier === 'none' ? 0 : length;
  return {
    color,
    length,
    tier,
    highlightCount,
  };
}

export function isColorStreakChip(index, run) {
  const count = run?.highlightCount ?? 0;
  return Number.isInteger(index) && index >= 0 && index < count;
}
