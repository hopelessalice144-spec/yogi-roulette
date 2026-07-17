/** Brief cell flash when undo newly clears a bet on a cell. */

export function shouldChipUndoClearEntryPulse(prevClear, nextClear) {

  return prevClear !== true && nextClear === true;

}

