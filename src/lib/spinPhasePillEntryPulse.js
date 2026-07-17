/** Brief spin-phase pill flash when the wheel spin phase starts. */
export function shouldSpinPhasePillEntryPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
