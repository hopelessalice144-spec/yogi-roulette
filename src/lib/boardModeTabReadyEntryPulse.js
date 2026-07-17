/** Brief board-mode tab flash when the active layout tab becomes actionable. */
export function shouldBoardModeTabReadyEntryPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
