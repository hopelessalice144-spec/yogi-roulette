import { describe, expect, it } from 'vitest';

import { shouldScaleReadyEntryPulse } from './scaleReadyEntryPulse.js';



describe('scaleReadyEntryPulse', () => {

  it('pulses only when scale controls newly become actionable', () => {

    expect(shouldScaleReadyEntryPulse(false, true)).toBe(true);

    expect(shouldScaleReadyEntryPulse(true, true)).toBe(false);

    expect(shouldScaleReadyEntryPulse(true, false)).toBe(false);

    expect(shouldScaleReadyEntryPulse(false, false)).toBe(false);

  });

});

