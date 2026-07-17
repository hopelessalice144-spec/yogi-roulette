/** Brief payout-toast flash when a new win toast is shown. */
export function shouldPayoutToastReadyPulse(prevCount, nextCount) {
  const prev = Math.max(0, Math.floor(Number(prevCount) || 0));
  const next = Math.max(0, Math.floor(Number(nextCount) || 0));
  return next > prev;
}
