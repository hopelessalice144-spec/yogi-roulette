/** Brief stake-scale cluster flash when half or double becomes available. */

export function shouldScaleReadyEntryPulse(prevEligible, nextEligible) {

  return prevEligible !== true && nextEligible === true;

}

