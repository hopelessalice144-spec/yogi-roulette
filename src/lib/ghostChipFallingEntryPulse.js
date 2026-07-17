/** Brief flash when a ghost preview chip newly starts falling. */

export function shouldGhostChipFallingEntryPulse(prevFalling, nextFalling) {

  return prevFalling !== true && nextFalling === true;

}

