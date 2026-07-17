/** Subtle lock-banner pulse while the no-more-bets toast is visible. */
export function shouldLockBannerReadyGlow(phaseName, visible) {
  return visible === true && phaseName === 'locked';
}
