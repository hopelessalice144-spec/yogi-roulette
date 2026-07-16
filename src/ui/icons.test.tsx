import { describe, expect, it } from 'vitest';
import { IconShieldCheck, IconVolumeOff, IconVolumeOn } from './icons.jsx';

describe('icons', () => {
  it('exports vector HUD icon components', () => {
    expect(typeof IconVolumeOn).toBe('function');
    expect(typeof IconVolumeOff).toBe('function');
    expect(typeof IconShieldCheck).toBe('function');
  });
});
