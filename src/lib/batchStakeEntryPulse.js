/** Brief panel-header flash when a racetrack or neighbor batch commits. */

export function shouldBatchStakeEntryPulse(pulseKey) {

  return Math.floor(Number(pulseKey) || 0) > 0;

}

