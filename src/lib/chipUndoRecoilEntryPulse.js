/** Brief cell flash when undo recoil newly activates on a cell. */

export function shouldChipUndoRecoilEntryPulse(prevRecoil, nextRecoil) {

  return prevRecoil !== true && nextRecoil === true;

}

