import { describe, expect, it } from 'vitest';
import { shouldStatsPanelReadyPulse } from './statsPanelReadyPulse.js';

describe('statsPanelReadyPulse', () => {
  it('pulses only when stats become newly available', () => {
    expect(shouldStatsPanelReadyPulse(false, true)).toBe(true);
    expect(shouldStatsPanelReadyPulse(true, true)).toBe(false);
    expect(shouldStatsPanelReadyPulse(true, false)).toBe(false);
    expect(shouldStatsPanelReadyPulse(false, false)).toBe(false);
  });
});
