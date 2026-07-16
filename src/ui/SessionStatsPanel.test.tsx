import { describe, expect, it } from 'vitest';
import { SessionStatsPanel } from './SessionStatsPanel.jsx';

describe('SessionStatsPanel', () => {
  it('exports the session stats panel component', () => {
    expect(typeof SessionStatsPanel).toBe('function');
  });
});
