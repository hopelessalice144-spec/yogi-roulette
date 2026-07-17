import { describe, expect, it } from 'vitest';

import { shouldResultPillRevealEntryPulse } from './resultPillRevealEntryPulse.js';

describe('resultPillRevealEntryPulse', () => {
  it('pulses only when result reveal newly becomes eligible', () => {
    expect(shouldResultPillRevealEntryPulse(false, true)).toBe(true);
    expect(shouldResultPillRevealEntryPulse(true, true)).toBe(false);
    expect(shouldResultPillRevealEntryPulse(true, false)).toBe(false);
    expect(shouldResultPillRevealEntryPulse(false, false)).toBe(false);
  });
});
