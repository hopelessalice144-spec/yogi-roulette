import { describe, expect, it } from 'vitest';
import { PhasePill } from './PhasePill.jsx';

describe('PhasePill', () => {
  it('exports the phase pill HUD component', () => {
    expect(typeof PhasePill).toBe('function');
  });
});
