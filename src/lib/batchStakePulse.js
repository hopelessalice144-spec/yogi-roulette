/** Trigger panel-header flash when a racetrack or neighbor batch commits. */
export function shouldBatchStakePulse(committed) {
  return committed === true;
}
