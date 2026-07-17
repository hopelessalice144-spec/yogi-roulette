import { describe, expect, it } from 'vitest';
import { shouldStatsPanelReadyGlow } from './statsPanelReadyGlow.js';

describe('statsPanelReadyGlow', () => {
  it('glows when rounds exist and the panel is collapsed', () => {
    expect(shouldStatsPanelReadyGlow([{ cycleId: 1 }], false)).toBe(true);
    expect(shouldStatsPanelReadyGlow([{ cycleId: 1 }], true)).toBe(false);
    expect(shouldStatsPanelReadyGlow([], false)).toBe(false);
  });
});
