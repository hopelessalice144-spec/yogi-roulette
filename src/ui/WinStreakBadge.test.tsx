import { describe, expect, it } from 'vitest';
import { WinStreakBadge } from './WinStreakBadge.jsx';

describe('WinStreakBadge', () => {
  it('exports the win streak HUD badge component', () => {
    expect(typeof WinStreakBadge).toBe('function');
  });
});
