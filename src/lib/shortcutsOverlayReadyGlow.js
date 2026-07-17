/** Subtle ?-help pulse while betting is open and shortcuts overlay is closed. */
export function shouldShortcutsOverlayReadyGlow(bettingOpen, shortcutsOpen = false) {
  if (shortcutsOpen === true) return false;
  return bettingOpen === true;
}
