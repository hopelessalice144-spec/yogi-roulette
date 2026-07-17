import { describe, expect, it } from 'vitest';
import {
  SPIN_SOFT_OPACITY,
  shouldDimBettingPanel,
  spinFocusCssVars,
  spinFocusDimLevel,
} from './spinFocusDim.js';

describe('spinFocusDim', () => {
  it('flags deep dim only during spin-focus HUD phase', () => {
    expect(shouldDimBettingPanel('spin-focus')).toBe(true);
    expect(shouldDimBettingPanel('locked')).toBe(false);
    expect(shouldDimBettingPanel('betting')).toBe(false);
  });

  it('resolves soft dim during locked and deep dim during spin-focus', () => {
    expect(spinFocusDimLevel('betting', 'betting')).toBe('none');
    expect(spinFocusDimLevel('locked', 'locked')).toBe('soft');
    expect(spinFocusDimLevel('spin-focus', 'spinning')).toBe('deep');
  });

  it('exports spin-focus CSS vars from hud config', () => {
    expect(spinFocusCssVars({ spinFocusOpacity: 0.15, spinFocusScale: 0.95 })).toEqual({
      '--spin-focus-opacity': '0.15',
      '--spin-focus-scale': '0.95',
      '--spin-soft-opacity': String(SPIN_SOFT_OPACITY),
      '--spin-soft-scale': '0.98',
    });
  });
});
