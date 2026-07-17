import { shouldChipSelectBounce } from './chipSelectBounce.js';

/** Brief chip-rack flash when the active denomination changes. */
export function shouldChipSelectPulse(prevValue, nextValue) {
  return shouldChipSelectBounce(prevValue, nextValue);
}
