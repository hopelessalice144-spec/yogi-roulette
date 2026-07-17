/** Trigger panel-header flash when a single chip bet is committed. */
export function shouldStakeCommitPulse(committed) {
  return committed === true;
}
