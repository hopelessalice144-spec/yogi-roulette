/** Brief theme-button flash when theme switching becomes eligible. */
export function shouldThemeToggleReadyPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
