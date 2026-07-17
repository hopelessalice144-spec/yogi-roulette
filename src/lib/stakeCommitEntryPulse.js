/** Brief panel-header flash when a single chip bet is committed. */

export function shouldStakeCommitEntryPulse(pulseKey) {

  return Math.floor(Number(pulseKey) || 0) > 0;

}

