import { describe, expect, it } from 'vitest';
import { shouldAudioToggleReadyGlow } from './audioToggleReadyGlow.js';

describe('audioToggleReadyGlow', () => {
  it('glows only when audio is muted', () => {
    expect(shouldAudioToggleReadyGlow(true)).toBe(true);
    expect(shouldAudioToggleReadyGlow(false)).toBe(false);
  });
});
