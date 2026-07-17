import { describe, expect, it } from 'vitest';
import { celebrationParticleCount, winCelebrationTier } from './winCelebration.js';

describe('winCelebration', () => {
  it('escalates tiers by net win', () => {
    expect(winCelebrationTier(0).id).toBe('none');
    expect(winCelebrationTier(10).id).toBe('small');
    expect(winCelebrationTier(300).id).toBe('big');
    expect(winCelebrationTier(2500).id).toBe('legendary');
  });

  it('scales particle count with tier', () => {
    expect(celebrationParticleCount(120, 2)).toBe(240);
    expect(celebrationParticleCount(120, 0)).toBe(24);
  });
});
