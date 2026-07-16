import { describe, expect, it } from 'vitest';
import { EuropeanWheelVisual } from './EuropeanWheelVisual.jsx';

describe('EuropeanWheelVisual', () => {
  it('exports the european wheel visual component', () => {
    expect(typeof EuropeanWheelVisual).toBe('function');
  });
});
