import { describe, expect, it } from 'vitest';
import { settleRimGlowKey, shouldSettleRimGlow } from './settleRimGlow.js';

describe('settleRimGlow', () => {
  it('enables rim glow only on settle reveal with a number', () => {
    expect(shouldSettleRimGlow('settle-reveal', 17)).toBe(true);
    expect(shouldSettleRimGlow('spin-focus', 17)).toBe(false);
    expect(shouldSettleRimGlow('settle-reveal', null)).toBe(false);
  });

  it('builds stable rim glow keys per winning number', () => {
    expect(settleRimGlowKey(17, 'settle-reveal')).toBe('rim-17');
    expect(settleRimGlowKey(null, 'betting')).toBeNull();
  });
});
