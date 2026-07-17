/** Trigger panel-header glow when last round bets were restored. */
export function shouldRepeatRoundPulse(repeatedBets) {
  return Array.isArray(repeatedBets) && repeatedBets.length > 0;
}
