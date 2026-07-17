import { describe, expect, it } from 'vitest';
import { shouldResultPillReadyGlow } from './resultPillReadyGlow.js';

describe('resultPillReadyGlow', () => {
  it('glows only while awaiting the first session spin', () => {
    expect(shouldResultPillReadyGlow(null, [])).toBe(true);
    expect(shouldResultPillReadyGlow(null, [{ number: 7 }])).toBe(false);
    expect(shouldResultPillReadyGlow(17, [])).toBe(false);
  });
});
