/** Brief chip flash when a dock chip newly becomes selected. */

export function shouldChipSelectEntryPulse(prevActive, nextActive) {

  return prevActive !== true && nextActive === true;

}

