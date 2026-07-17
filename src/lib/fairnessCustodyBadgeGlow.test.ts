import { describe, expect, it } from 'vitest';
import { shouldFairnessCustodyBadgeGlow } from './fairnessCustodyBadgeGlow.js';

describe('fairnessCustodyBadgeGlow', () => {
  const badge = { badge: 'demo', label: 'Demo', title: 'Demo custody' };

  it('glows only when history exists, badge is present, and panel is collapsed', () => {
    expect(shouldFairnessCustodyBadgeGlow([{ cycleId: 1 }], badge, false)).toBe(true);
    expect(shouldFairnessCustodyBadgeGlow([{ cycleId: 1 }], badge, true)).toBe(false);
    expect(shouldFairnessCustodyBadgeGlow([], badge, false)).toBe(false);
    expect(shouldFairnessCustodyBadgeGlow([{ cycleId: 1 }], null, false)).toBe(false);
  });
});
