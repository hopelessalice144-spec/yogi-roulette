import { describe, expect, it } from 'vitest';
import { GameProvider } from './GameContext.jsx';

describe('GameContext', () => {
  it('exports the game provider component', () => {
    expect(typeof GameProvider).toBe('function');
  });
});
