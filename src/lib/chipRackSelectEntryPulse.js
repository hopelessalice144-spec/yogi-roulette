import { shouldChipSelectBounce } from './chipSelectBounce.js';

/** Brief chip-rack flash when the active denomination changes. */

export function shouldChipRackSelectEntryPulse(prevValue, nextValue) {

  return shouldChipSelectBounce(prevValue, nextValue);

}

