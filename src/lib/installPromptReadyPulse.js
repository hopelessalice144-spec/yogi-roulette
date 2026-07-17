/** Brief install-panel flash when the PWA prompt becomes available. */
export function shouldInstallPromptReadyPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
