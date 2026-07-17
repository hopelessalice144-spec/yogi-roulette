/** Brief install-panel flash when the PWA prompt becomes available. */
export function shouldInstallPromptReadyEntryPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
