/** Brief undo-button flash when bet revert becomes available. */
export function shouldUndoRoundReadyPulse(prevCanUndo, nextCanUndo) {
  return prevCanUndo !== true && nextCanUndo === true;
}
