/** Subtle chip-rack idle pulse while the betting window is open. */
export function shouldChipRackBettingGlow(bettingOpen) {
  return bettingOpen === true;
}
