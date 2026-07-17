import { describe, expect, it } from 'vitest';
import {
  isEscapeKey,
  isShortcutsToggleKey,
  shortcutActionKey,
  shortcutChipIndex,
} from './keyboardShortcuts.js';

describe('keyboardShortcuts', () => {
  it('detects help toggle keys', () => {
    expect(isShortcutsToggleKey({ key: '?' })).toBe(true);
    expect(isShortcutsToggleKey({ key: '/', shiftKey: true })).toBe(true);
    expect(isShortcutsToggleKey({ key: '/', shiftKey: false })).toBe(false);
    expect(isShortcutsToggleKey({ key: '?', ctrlKey: true })).toBe(false);
  });

  it('maps digit keys to chip rack indices', () => {
    expect(shortcutChipIndex({ key: '2' }, 5)).toBe(1);
    expect(shortcutChipIndex({ key: '6' }, 5)).toBe(-1);
  });

  it('maps action keys for bet controls', () => {
    expect(shortcutActionKey({ key: 'u' })).toBe('undo');
    expect(shortcutActionKey({ key: 'R' })).toBe('repeat');
    expect(shortcutActionKey({ key: ']' })).toBe('scaleDouble');
    expect(shortcutActionKey({ key: 'x' })).toBe(null);
  });

  it('detects escape', () => {
    expect(isEscapeKey({ key: 'Escape' })).toBe(true);
  });
});
