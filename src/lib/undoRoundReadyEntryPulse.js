/** Brief undo-button flash when bet revert becomes available. */
export function shouldUndoRoundReadyEntryPulse(prevCanUndo, nextCanUndo) {
  return prevCanUndo !== true && nextCanUndo === true;
}
