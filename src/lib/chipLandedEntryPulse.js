/** Brief cell flash when a bet chip newly lands on a cell. */

export function shouldChipLandedEntryPulse(prevPlaced, nextPlaced) {

  return prevPlaced !== true && nextPlaced === true;

}

