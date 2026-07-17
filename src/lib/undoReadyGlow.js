/** Subtle undo-button pulse when last bet can be reverted. */
export function shouldUndoReadyGlow(canUndo) {
  return canUndo === true;
}
