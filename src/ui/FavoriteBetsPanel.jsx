import { useEffect, useMemo, useRef, useState } from 'react';
import { favoriteSummary } from '../lib/favoriteBets.js';
import { shouldFavoritesPanelReadyGlow } from '../lib/favoritesPanelReadyGlow.js';
import { shouldFavoritesPanelReadyEntryPulse } from '../lib/favoritesPanelReadyEntryPulse.js';
import { shouldSavePresetReadyGlow } from '../lib/savePresetReadyGlow.js';
import { shouldSavePresetReadyEntryPulse } from '../lib/savePresetReadyEntryPulse.js';

export function FavoriteBetsPanel({
  favorites,
  currentStaked,
  bettingOpen,
  expanded,
  onToggle,
  onSave,
  onApply,
  onDelete,
}) {
  const [name, setName] = useState('');
  const canSave = bettingOpen && currentStaked > 0;

  const sorted = useMemo(
    () => [...favorites].sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0)),
    [favorites]
  );

  const handleSave = () => {
    if (!canSave) return;
    const trimmed = name.trim();
    onSave?.(trimmed || `Preset ${sorted.length + 1}`);
    setName('');
  };

  const favoritesReadyGlow = shouldFavoritesPanelReadyGlow(favorites, expanded);
  const prevFavoritesReadyRef = useRef(false);
  const [favoritesReadyEntryPulsing, setFavoritesReadyEntryPulsing] = useState(false);

  useEffect(() => {
    const prevFavoritesReady = prevFavoritesReadyRef.current;
    prevFavoritesReadyRef.current = favoritesReadyGlow;
    if (!shouldFavoritesPanelReadyEntryPulse(prevFavoritesReady, favoritesReadyGlow)) return undefined;
    setFavoritesReadyEntryPulsing(true);
    const timer = window.setTimeout(() => setFavoritesReadyEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [favoritesReadyGlow]);

  const savePresetReadyGlow = shouldSavePresetReadyGlow(bettingOpen, currentStaked);
  const prevSavePresetReadyRef = useRef(false);
  const [savePresetReadyEntryPulsing, setSavePresetReadyEntryPulsing] = useState(false);

  useEffect(() => {
    const prevSavePresetReady = prevSavePresetReadyRef.current;
    prevSavePresetReadyRef.current = savePresetReadyGlow;
    if (!shouldSavePresetReadyEntryPulse(prevSavePresetReady, savePresetReadyGlow)) return undefined;
    setSavePresetReadyEntryPulsing(true);
    const timer = window.setTimeout(() => setSavePresetReadyEntryPulsing(false), 620);
    return () => window.clearTimeout(timer);
  }, [savePresetReadyGlow]);

  return (
    <section className={`favorite-bets ${expanded ? 'expanded' : ''}`} data-testid="favorite-bets-panel">
      <button
        type="button"
        className={[
          'favorite-bets-toggle',
          favoritesReadyGlow ? 'favorites-ready-glow-active' : '',
          favoritesReadyEntryPulsing ? 'favorites-ready-entry-pulse' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <span className="favorite-bets-label">Favorite Bets</span>
        <span className="favorite-count">{favorites.length}</span>
      </button>

      {expanded && (
        <div className="favorite-bets-body">
          <div className="favorite-save-row">
            <input
              type="text"
              className="favorite-name-input"
              placeholder="Preset name…"
              value={name}
              maxLength={28}
              disabled={!canSave}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
              aria-label="Favorite preset name"
            />
            <button
              type="button"
              className={[
                'btn',
                'gold',
                'favorite-save-btn',
                savePresetReadyGlow ? 'save-preset-ready-glow-active' : '',
                savePresetReadyEntryPulsing ? 'save-preset-ready-entry-pulse' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              disabled={!canSave}
              onClick={handleSave}
            >
              Save
            </button>
          </div>
          {!canSave && (
            <p className="favorite-hint">
              {currentStaked > 0 ? 'Bets locked — presets unavailable.' : 'Place bets to save a preset.'}
            </p>
          )}

          {sorted.length === 0 ? (
            <p className="favorite-empty">No saved presets yet.</p>
          ) : (
            <ul className="favorite-list">
              {sorted.map((fav) => (
                <li key={fav.id} className="favorite-item">
                  <div className="favorite-meta">
                    <strong className="favorite-name">{fav.name}</strong>
                    <span className="favorite-summary">{favoriteSummary(fav)}</span>
                  </div>
                  <div className="favorite-actions">
                    <button
                      type="button"
                      className="btn ghost favorite-apply-btn"
                      disabled={!bettingOpen}
                      onClick={() => onApply?.(fav)}
                      aria-label={`Apply ${fav.name}`}
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      className="btn ghost favorite-delete-btn"
                      onClick={() => onDelete?.(fav.id)}
                      aria-label={`Delete ${fav.name}`}
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
