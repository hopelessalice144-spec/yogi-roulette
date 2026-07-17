import { describe, expect, it } from 'vitest';
import { shouldMobileDrawerOpenPulse } from './mobileDrawerOpenPulse.js';

describe('mobileDrawerOpenPulse', () => {
  it('pulses only when the drawer tab becomes newly actionable', () => {
    expect(shouldMobileDrawerOpenPulse(false, true)).toBe(true);
    expect(shouldMobileDrawerOpenPulse(true, true)).toBe(false);
    expect(shouldMobileDrawerOpenPulse(true, false)).toBe(false);
    expect(shouldMobileDrawerOpenPulse(false, false)).toBe(false);
  });
});
