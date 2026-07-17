/** Subtle stake-scale cluster pulse when half or double is available. */
export function shouldScaleReadyGlow(canHalf, canDouble) {
  return canHalf === true || canDouble === true;
}
