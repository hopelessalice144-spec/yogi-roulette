import { describe, expect, it } from 'vitest';

import {
  scaleBoardEntryPulseMode,
  shouldScaleBoardEntryPulse,
} from './scaleBoardEntryPulse.js';



describe('scaleBoardEntryPulse', () => {

  it('pulses only when a scale board key is active', () => {

    expect(shouldScaleBoardEntryPulse(0)).toBe(false);

    expect(shouldScaleBoardEntryPulse(3)).toBe(true);

  });



  it('maps scale factors to half/double entry modes', () => {

    expect(scaleBoardEntryPulseMode(0.5)).toBe('half');

    expect(scaleBoardEntryPulseMode(2)).toBe('double');

    expect(scaleBoardEntryPulseMode(1)).toBeNull();

  });

});

