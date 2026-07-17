/** Brief drawer meta flash when the at-risk staked total changes. */

export function shouldDrawerMetaEntryPulse(prevStaked, nextStaked) {

  return Math.floor(Number(prevStaked) || 0) !== Math.floor(Number(nextStaked) || 0);

}

