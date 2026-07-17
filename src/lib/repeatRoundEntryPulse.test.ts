import { describe, expect, it } from 'vitest';

import { shouldRepeatRoundEntryPulse } from './repeatRoundEntryPulse.js';



describe('repeatRoundEntryPulse', () => {

  it('pulses only when a repeat round key is active', () => {

    expect(shouldRepeatRoundEntryPulse(0)).toBe(false);

    expect(shouldRepeatRoundEntryPulse(4)).toBe(true);

  });

});

