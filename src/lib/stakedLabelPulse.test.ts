import { describe, expect, it } from 'vitest';
import {
  shouldStakedLabelPulse,
  stakedLabelPulseKey,
} from './stakedLabelPulse.js';

describe('stakedLabelPulse', () => {
  it('pulses only when a commit pulse key is active', () => {
    expect(shouldStakedLabelPulse(0)).toBe(false);
    expect(shouldStakedLabelPulse(2)).toBe(true);
  });

  it('merges stake and batch commit keys', () => {
    expect(stakedLabelPulseKey(0, 0)).toBeNull();
    expect(stakedLabelPulseKey(3, 0)).toBe('staked-label-3');
    expect(stakedLabelPulseKey(1, 5)).toBe('staked-label-5');
  });
});
