import { describe, expect, it } from 'vitest';
import { EuropeanWheel } from './EuropeanWheel.jsx';

describe('EuropeanWheel', () => {
  it('exports the european wheel component', () => {
    expect(typeof EuropeanWheel).toBe('function');
  });
});
