import { describe, expect, it } from 'vitest';
import { ShortcutsOverlay } from './ShortcutsOverlay.jsx';

describe('ShortcutsOverlay', () => {
  it('exports the shortcuts overlay component', () => {
    expect(typeof ShortcutsOverlay).toBe('function');
  });
});
