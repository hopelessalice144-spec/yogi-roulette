/** Brief shortcuts-help flash when the betting window opens. */
export function shouldShortcutsOverlayReadyEntryPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
