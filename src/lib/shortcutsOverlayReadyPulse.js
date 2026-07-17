/** Brief shortcuts-help flash when betting opens with the overlay closed. */
export function shouldShortcutsOverlayReadyPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
