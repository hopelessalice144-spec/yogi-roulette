/** Brief board-mode tab flash when the active layout tab becomes actionable. */
export function shouldBoardModeTabReadyPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
