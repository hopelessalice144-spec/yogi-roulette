/** Smallest placeable chip denomination. */
export function minChipBet(chipValues = []) {
  const numeric = (Array.isArray(chipValues) ? chipValues : [])
    .map((value) => Math.floor(Number(value)))
    .filter((value) => value > 0);
  return numeric.length ? Math.min(...numeric) : 1;
}

/** Subtle wallet pulse when balance cannot cover the minimum chip bet. */
export function shouldBalanceLowGlow(balance, chipValues, { securityFrozen = false } = {}) {
  if (securityFrozen) return false;
  const minBet = minChipBet(chipValues);
  return Math.floor(Number(balance) || 0) < minBet;
}
