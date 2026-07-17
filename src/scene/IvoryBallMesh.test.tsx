import { describe, expect, it } from 'vitest';
import { IvoryBallMesh } from './IvoryBallMesh.jsx';

describe('IvoryBallMesh', () => {
  it('exports the ivory ball mesh', () => {
    expect(typeof IvoryBallMesh).toBe('function');
  });
});
