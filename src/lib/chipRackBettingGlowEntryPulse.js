/** Brief chip-rack flash when betting glow newly activates. */

export function shouldChipRackBettingGlowEntryPulse(prevGlow, nextGlow) {

  return prevGlow !== true && nextGlow === true;

}

