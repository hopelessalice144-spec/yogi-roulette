/** Brief wallet flash when balance settle win/loss pulse newly activates. */
export function shouldBalanceSettleEntryPulse(prevKey, nextKey, nextTone) {
  const prev = Math.max(0, Math.floor(Number(prevKey) || 0));
  const next = Math.max(0, Math.floor(Number(nextKey) || 0));
  return next > prev && (nextTone === 'win' || nextTone === 'loss');
}
