export const SHORTCUT_HELP_ROWS = [
  { keys: ['?'], label: 'Show or hide shortcuts help' },
  { keys: ['Esc'], label: 'Close shortcuts help' },
  { keys: ['1', '…', '5'], label: 'Select chip denomination' },
  { keys: ['U'], label: 'Undo last bet' },
  { keys: ['R'], label: 'Repeat last round' },
  { keys: ['C'], label: 'Clear all bets' },
  { keys: ['['], label: 'Halve all board stakes' },
  { keys: [']'], label: 'Double all board stakes' },
  { keys: ['F1', 'F2', 'F3'], label: 'Apply saved favorite presets' },
];

export function isShortcutsToggleKey(event) {
  if (!event || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
    return false;
  }
  return event.key === '?' || (event.key === '/' && event.shiftKey);
}

export function isEscapeKey(event) {
  return event?.key === 'Escape';
}

export function shortcutChipIndex(event, chipCount) {
  if (!event || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
    return -1;
  }
  if (event.target?.closest?.('input, textarea, select, [contenteditable="true"]')) {
    return -1;
  }
  const digit = Number(event.key);
  if (!Number.isInteger(digit) || digit < 1 || digit > chipCount) return -1;
  return digit - 1;
}

export function shortcutActionKey(event) {
  if (!event || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
    return null;
  }
  if (event.target?.closest?.('input, textarea, select, [contenteditable="true"]')) {
    return null;
  }
  const key = event.key.toLowerCase();
  if (key === 'u') return 'undo';
  if (key === 'r') return 'repeat';
  if (key === 'c') return 'clear';
  if (event.key === '[') return 'scaleHalf';
  if (event.key === ']') return 'scaleDouble';
  return null;
}
