/** Subtle save-button pulse when the current board can be saved as a preset. */
export function shouldSavePresetReadyGlow(bettingOpen, currentStaked) {
  return bettingOpen === true && Math.floor(Number(currentStaked) || 0) > 0;
}
