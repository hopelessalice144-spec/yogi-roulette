import { describe, expect, it } from 'vitest';
import { RouletteBall } from './RouletteBall.jsx';

describe('RouletteBall', () => {
  it('exports the roulette ball component', () => {
    expect(typeof RouletteBall).toBe('function');
  });
});
