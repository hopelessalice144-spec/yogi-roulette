/** Subtle status-line idle pulse while the betting window is open. */
export function shouldStatusLineReadyGlow(bettingOpen) {
  return bettingOpen === true;
}
