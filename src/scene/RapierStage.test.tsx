import { describe, expect, it } from 'vitest';
import { RapierStage } from './RapierStage.jsx';

describe('RapierStage', () => {
  it('exports the rapier stage component', () => {
    expect(typeof RapierStage).toBe('function');
  });
});
