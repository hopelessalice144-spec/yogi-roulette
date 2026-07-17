/** Brief theme-button flash when theme switching becomes eligible. */
export function shouldThemeToggleReadyEntryPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
