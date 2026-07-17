/** Brief cell flash when repeat-round newly restores a bet on a cell. */

export function shouldRepeatFlashEntryPulse(prevRepeated, nextRepeated) {

  return prevRepeated !== true && nextRepeated === true;

}

