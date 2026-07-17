export const LOCK_BANNER_DURATION_MS = 3200;

/** Show the lock banner when betting closes for the round. */
export function shouldShowLockBanner(prevPhase, nextPhase) {
  return prevPhase === 'betting' && nextPhase === 'locked';
}
