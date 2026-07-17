import { describe, expect, it } from 'vitest';
import { resultPillRevealKey, shouldResultPillFlyIn } from './resultPillFlyIn.js';

describe('resultPillFlyIn', () => {
  it('enables fly-in only on settle reveal with a number', () => {
    expect(shouldResultPillFlyIn(17, 'settle-reveal')).toBe(true);
    expect(shouldResultPillFlyIn(17, 'spin-focus')).toBe(false);
    expect(shouldResultPillFlyIn(null, 'settle-reveal')).toBe(false);
  });

  it('builds stable reveal keys per winning number', () => {
    expect(resultPillRevealKey(17, 'settle-reveal')).toBe('reveal-17');
    expect(resultPillRevealKey(null, 'betting')).toBe('awaiting');
  });
});
