import { describe, expect, it } from 'vitest';
import { FELT_GOLD, FELT_GOLD_MID } from './designTokens.js';

describe('designTokens', () => {
  it('exports lounge felt gold hex values', () => {
    expect(FELT_GOLD).toBe('#f5d78e');
    expect(FELT_GOLD_MID).toBe('#e8c878');
  });
});
