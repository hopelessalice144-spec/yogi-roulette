/** Brief header flash when settle-reveal header bloom newly activates. */
export function shouldSettleHeaderBloomEntryPulse(prevKey, nextKey) {
  return nextKey != null && prevKey !== nextKey;
}
