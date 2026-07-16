import { describe, expect, it } from 'vitest';
import { LoungeDust } from './LoungeDust.jsx';

describe('LoungeDust', () => {
  it('exports the lounge dust component', () => {
    expect(typeof LoungeDust).toBe('function');
  });
});
