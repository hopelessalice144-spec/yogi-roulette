import { describe, expect, it } from 'vitest';
import { FeltTable } from './FeltTable.jsx';

describe('FeltTable', () => {
  it('exports the felt table component', () => {
    expect(typeof FeltTable).toBe('function');
  });
});
