import { describe, expect, it } from 'vitest';
import { shouldFairnessPanelReadyGlow } from './fairnessPanelReadyGlow.js';

describe('fairnessPanelReadyGlow', () => {
  it('glows when audit history exists and the panel is collapsed', () => {
    expect(shouldFairnessPanelReadyGlow([{ cycleId: 1 }], false)).toBe(true);
    expect(shouldFairnessPanelReadyGlow([{ cycleId: 1 }], true)).toBe(false);
    expect(shouldFairnessPanelReadyGlow([], false)).toBe(false);
  });
});
