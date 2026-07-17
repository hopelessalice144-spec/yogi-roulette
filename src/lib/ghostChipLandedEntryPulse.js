/** Brief flash when a ghost preview chip newly lands on a cell. */

export function shouldGhostChipLandedEntryPulse(prevLanded, nextLanded) {

  return prevLanded !== true && nextLanded === true;

}

