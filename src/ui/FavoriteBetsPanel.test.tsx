import { describe, expect, it } from 'vitest';
import { FavoriteBetsPanel } from './FavoriteBetsPanel.jsx';

describe('FavoriteBetsPanel', () => {
  it('exports the favorite bets panel component', () => {
    expect(typeof FavoriteBetsPanel).toBe('function');
  });
});
