import { describe, expect, it } from 'vitest';
import { GameScene } from './GameScene.jsx';

describe('GameScene', () => {
  it('exports the game scene component', () => {
    expect(typeof GameScene).toBe('function');
  });
});
