export const DEFAULT_STAKE_RISK_THRESHOLD = 0.5;

/** True when staked chips exceed the balance risk threshold (default 50%). */
export function stakeRiskLevel(staked, balance, threshold = DEFAULT_STAKE_RISK_THRESHOLD) {
  const safeStaked = Math.max(0, Math.floor(Number(staked) || 0));
  const safeBalance = Math.max(0, Math.floor(Number(balance) || 0));
  if (safeStaked <= 0 || safeBalance <= 0) {
    return { highRisk: false, ratio: 0 };
  }

  const ratio = safeStaked / safeBalance;
  return {
    highRisk: ratio > threshold,
    ratio,
  };
}
