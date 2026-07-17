import { describe, expect, it } from 'vitest';
import {
  settleRevealHeaderBloomKey,
  shouldSettleRevealHeaderBloom,
} from './settleRevealHeaderBloom.js';

describe('settleRevealHeaderBloom', () => {
  it('blooms only during settle reveal with a winning number', () => {
    expect(shouldSettleRevealHeaderBloom(17, 'settle-reveal')).toBe(true);
    expect(shouldSettleRevealHeaderBloom(null, 'settle-reveal')).toBe(false);
    expect(shouldSettleRevealHeaderBloom(17, 'spin-focus')).toBe(false);
  });

  it('builds a stable replay key per result', () => {
    expect(settleRevealHeaderBloomKey(17, 'settle-reveal')).toBe('header-bloom-17');
    expect(settleRevealHeaderBloomKey(null, 'settle-reveal')).toBeNull();
  });
});
