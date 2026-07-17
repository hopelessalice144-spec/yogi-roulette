/** Brief synced payout-toast flash when a reveal-synced win toast appears. */
export function shouldPayoutToastSyncEntryPulse(prevCount, nextCount) {
  const prev = Math.max(0, Math.floor(Number(prevCount) || 0));
  const next = Math.max(0, Math.floor(Number(nextCount) || 0));
  return next > prev;
}
