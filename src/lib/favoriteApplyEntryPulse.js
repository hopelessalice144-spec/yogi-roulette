/** Brief panel-header flash when a saved favorite preset is applied. */

export function shouldFavoriteApplyEntryPulse(pulseKey) {

  return Math.floor(Number(pulseKey) || 0) > 0;

}

