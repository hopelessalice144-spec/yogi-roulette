/** Brief flash when pathway column cascade newly begins. */
export function shouldPathwayCascadeEntryPulse(prevEligible, nextEligible) {
  return prevEligible !== true && nextEligible === true;
}
