/** Tone for wallet settle pulse — only when the player had money at risk. */
export function balanceSettleTone(net, risked) {
  const safeNet = Math.floor(Number(net) || 0);
  const safeRisked = Math.floor(Number(risked) || 0);
  if (safeRisked <= 0) return null;
  if (safeNet > 0) return 'win';
  if (safeNet < 0) return 'loss';
  return null;
}
