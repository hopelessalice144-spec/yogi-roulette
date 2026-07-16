import { describe, expect, it } from 'vitest';
import { BettingBoard } from './BettingBoard.jsx';

describe('BettingBoard', () => {
  it('exports the betting board component', () => {
    expect(typeof BettingBoard).toBe('function');
  });
});
