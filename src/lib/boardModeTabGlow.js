/** Subtle pulse on the active board layout tab while betting is open. */
export function shouldBoardModeTabGlow(bettingOpen, isActive) {
  return bettingOpen === true && isActive === true;
}
