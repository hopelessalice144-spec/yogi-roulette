import { describe, expect, it } from 'vitest';
import { MaterialLibrary } from './MaterialLibrary.jsx';

describe('MaterialLibrary', () => {
  it('exports the material library component', () => {
    expect(typeof MaterialLibrary).toBe('function');
  });
});
