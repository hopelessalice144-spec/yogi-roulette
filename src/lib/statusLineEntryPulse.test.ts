import { describe, expect, it } from 'vitest';

import { shouldStatusLineEntryPulse } from './statusLineEntryPulse.js';

describe('statusLineEntryPulse', () => {
  it('pulses only for non-empty messages', () => {
    expect(shouldStatusLineEntryPulse('Bets locked.')).toBe(true);
    expect(shouldStatusLineEntryPulse('')).toBe(false);
    expect(shouldStatusLineEntryPulse('   ')).toBe(false);
    expect(shouldStatusLineEntryPulse(null)).toBe(false);
  });
});
