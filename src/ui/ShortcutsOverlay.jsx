import { useMemo } from 'react';
import { SHORTCUT_HELP_ROWS } from '../lib/keyboardShortcuts.js';
import { favoriteHotkeyLabels } from '../lib/favoriteHotkeys.js';
import { useBetShortcuts } from '../hooks/useBetShortcuts.js';

function chipShortcutLabel(chipValues = []) {
  if (!chipValues.length) return 'Select chip denomination';
  return chipValues.map((value, index) => `${index + 1}=$${value}`).join(' · ');
}

/**
 * Modal overlay listing bet keyboard shortcuts; wired via useBetShortcuts.
 */
export function ShortcutsOverlay({
  open,
  onOpenChange,
  chipValues = [],
  onSelectChip,
  onUndo,
  canUndo,
  onRepeat,
  canRepeat,
  onClear,
  onScaleHalf,
  canScaleHalf,
  onScaleDouble,
  canScaleDouble,
  favorites = [],
  onApplyFavorite,
  bettingOpen = false,
}) {
  useBetShortcuts({
    open,
    onOpenChange,
    chipValues,
    onSelectChip,
    onUndo,
    canUndo,
    onRepeat,
    canRepeat,
    onClear,
    onScaleHalf,
    canScaleHalf,
    onScaleDouble,
    canScaleDouble,
    favorites,
    onApplyFavorite,
    bettingOpen,
  });

  const rows = useMemo(() => {
    return SHORTCUT_HELP_ROWS.map((row) => {
      if (row.keys[0] === '1') {
        return { ...row, detail: chipShortcutLabel(chipValues) };
      }
      if (row.keys[0] === 'F1') {
        return { ...row, detail: favoriteHotkeyLabels(favorites).join(' · ') };
      }
      return row;
    });
  }, [chipValues, favorites]);

  if (!open) return null;

  return (
    <div
      className="shortcuts-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-overlay-title"
      data-testid="shortcuts-overlay"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="shortcuts-overlay-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="shortcuts-overlay-header">
          <h2 id="shortcuts-overlay-title">Bet controls</h2>
          <button
            type="button"
            className="shortcuts-close"
            onClick={() => onOpenChange(false)}
            aria-label="Close shortcuts help"
          >
            Esc
          </button>
        </div>
        <p className="shortcuts-overlay-lead">Keyboard shortcuts work during the betting phase.</p>
        <ul className="shortcuts-list">
          {rows.map((row) => (
            <li key={row.label} className="shortcuts-row">
              <span className="shortcuts-keys">
                {row.keys.map((key) => (
                  <kbd key={`${row.label}-${key}`}>{key}</kbd>
                ))}
              </span>
              <span className="shortcuts-desc">
                {row.label}
                {row.detail ? <small>{row.detail}</small> : null}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
