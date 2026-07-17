/** Brief staked-total flash when chips commit to the board. */

export function shouldStakedLabelEntryPulse(pulseKey) {

  return Math.floor(Number(pulseKey) || 0) > 0;

}

/** Combined stake/batch pulse key for the at-risk label entry flash. */

export function stakedLabelEntryPulseKey(stakeCommitKey, batchStakeKey) {

  const key = Math.max(

    Math.floor(Number(stakeCommitKey) || 0),

    Math.floor(Number(batchStakeKey) || 0),

  );

  return key > 0 ? `staked-label-entry-${key}` : null;

}

