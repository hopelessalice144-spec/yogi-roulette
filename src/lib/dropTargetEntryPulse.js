/** Brief cell flash when a bet cell newly becomes chip drop target. */

export function shouldDropTargetEntryPulse(prevTarget, nextTarget) {

  return prevTarget !== true && nextTarget === true;

}

