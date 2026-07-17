/** Brief chip-rack flash when the betting window becomes actionable. */
export function shouldChipRackReadyPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
