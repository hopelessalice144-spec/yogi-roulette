import { describe, expect, it } from 'vitest';
import { useBetShortcuts } from './useBetShortcuts.js';

describe('useBetShortcuts', () => {
  it('exports the bet shortcuts hook', () => {
    expect(typeof useBetShortcuts).toBe('function');
  });
});
