/** Brief flash when winning cell cascade newly begins on settle reveal. */
export function shouldWinningCellCascadeEntryPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
