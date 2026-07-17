import { describe, expect, it } from 'vitest';
import { shouldAudioToggleReadyPulse } from './audioToggleReadyPulse.js';

describe('audioToggleReadyPulse', () => {
  it('pulses only when mute becomes newly actionable', () => {
    expect(shouldAudioToggleReadyPulse(false, true)).toBe(true);
    expect(shouldAudioToggleReadyPulse(true, true)).toBe(false);
    expect(shouldAudioToggleReadyPulse(true, false)).toBe(false);
    expect(shouldAudioToggleReadyPulse(false, false)).toBe(false);
  });
});
