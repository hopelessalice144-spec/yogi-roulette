/** Brief red wallet flash when a losing balance settle pulse newly activates. */
export function shouldBalanceSettleLossEntryPulse(prevKey, nextKey, nextTone) {
  const prev = Math.max(0, Math.floor(Number(prevKey) || 0));
  const next = Math.max(0, Math.floor(Number(nextKey) || 0));
  return next > prev && nextTone === 'loss';
}
