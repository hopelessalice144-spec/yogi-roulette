import { describe, expect, it } from 'vitest';
import { shouldStatusLineFlash } from './statusLineFlash.js';

describe('statusLineFlash', () => {
  it('flashes only for non-empty messages', () => {
    expect(shouldStatusLineFlash('Bets locked.')).toBe(true);
    expect(shouldStatusLineFlash('')).toBe(false);
    expect(shouldStatusLineFlash('   ')).toBe(false);
    expect(shouldStatusLineFlash(null)).toBe(false);
  });
});
