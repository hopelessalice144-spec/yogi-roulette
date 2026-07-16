import { describe, expect, it } from 'vitest';
import { GhostChipStack, GhostConfettiBurst } from './GhostBetLayer.jsx';

describe('GhostBetLayer', () => {
  it('exports ghost bet overlay components', () => {
    expect(typeof GhostChipStack).toBe('function');
    expect(typeof GhostConfettiBurst).toBe('function');
  });
});
