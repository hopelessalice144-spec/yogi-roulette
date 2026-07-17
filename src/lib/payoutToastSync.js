/** Matches result-pill-fly-in duration in index.css */
export const RESULT_PILL_FLY_IN_MS = 780;

/** Delay after number reveal so toast peaks with pill fly-in (~38% of 780ms). */
export const PAYOUT_TOAST_SYNC_OFFSET_MS = 300;

export function shouldSyncPayoutToast(lastWin, displayNumber, hudPhase) {
  return lastWin > 0 && displayNumber != null && hudPhase === 'settle-reveal';
}

export function payoutToastSyncDelayMs(offsetMs = PAYOUT_TOAST_SYNC_OFFSET_MS) {
  return Math.max(0, Math.floor(Number(offsetMs) || 0));
}
