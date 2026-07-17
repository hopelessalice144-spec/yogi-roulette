import { useEffect } from 'react';
import {
  isEscapeKey,
  isShortcutsToggleKey,
  shortcutActionKey,
  shortcutChipIndex,
} from '../lib/keyboardShortcuts.js';
import { favoriteForHotkey, favoriteHotkeyIndex } from '../lib/favoriteHotkeys.js';

/**
 * Global bet-control keyboard shortcuts (disabled while help is open).
 */
export function useBetShortcuts({
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
}) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (isShortcutsToggleKey(event)) {
        event.preventDefault();
        onOpenChange(!open);
        return;
      }

      if (open) {
        if (isEscapeKey(event)) {
          event.preventDefault();
          onOpenChange(false);
        }
        return;
      }

      const chipIndex = shortcutChipIndex(event, chipValues?.length ?? 0);
      if (chipIndex >= 0 && chipValues?.[chipIndex] != null) {
        event.preventDefault();
        onSelectChip(chipValues[chipIndex]);
        return;
      }

      const favoriteIndex = favoriteHotkeyIndex(event);
      if (favoriteIndex >= 0 && bettingOpen) {
        const favorite = favoriteForHotkey(favorites, favoriteIndex);
        if (favorite) {
          event.preventDefault();
          onApplyFavorite?.(favorite);
        }
        return;
      }

      const action = shortcutActionKey(event);
      if (action === 'undo' && canUndo) {
        event.preventDefault();
        onUndo();
      } else if (action === 'repeat' && canRepeat) {
        event.preventDefault();
        onRepeat();
      } else if (action === 'clear') {
        event.preventDefault();
        onClear();
      } else if (action === 'scaleHalf' && canScaleHalf) {
        event.preventDefault();
        onScaleHalf();
      } else if (action === 'scaleDouble' && canScaleDouble) {
        event.preventDefault();
        onScaleDouble();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
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
  ]);
}
