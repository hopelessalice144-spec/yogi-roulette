/** Brief panel-header flash when last round bets are restored. */

export function shouldRepeatRoundEntryPulse(pulseKey) {

  return Math.floor(Number(pulseKey) || 0) > 0;

}

