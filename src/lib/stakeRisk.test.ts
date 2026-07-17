import { describe, expect, it } from 'vitest';
import { DEFAULT_STAKE_RISK_THRESHOLD, stakeRiskLevel } from './stakeRisk.js';

describe('stakeRisk', () => {
  it('flags high risk when staked exceeds half the balance', () => {
    expect(stakeRiskLevel(600, 1000)).toEqual({ highRisk: true, ratio: 0.6 });
    expect(stakeRiskLevel(500, 1000)).toEqual({ highRisk: false, ratio: 0.5 });
    expect(stakeRiskLevel(250, 1000)).toEqual({ highRisk: false, ratio: 0.25 });
  });

  it('ignores empty stake or balance', () => {
    expect(stakeRiskLevel(0, 1000)).toEqual({ highRisk: false, ratio: 0 });
    expect(stakeRiskLevel(100, 0)).toEqual({ highRisk: false, ratio: 0 });
  });

  it('exports default threshold constant', () => {
    expect(DEFAULT_STAKE_RISK_THRESHOLD).toBe(0.5);
  });
});
