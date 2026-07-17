import { describe, expect, it } from 'vitest';
import { useRoundSync } from './useRoundSync.js';

describe('useRoundSync', () => {
  it('exports the round sync hook', () => {
    expect(typeof useRoundSync).toBe('function');
  });
});
