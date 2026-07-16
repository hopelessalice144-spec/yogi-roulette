import { describe, expect, it } from 'vitest';
import { VolumetricGodRays } from './VolumetricGodRays.jsx';

describe('VolumetricGodRays', () => {
  it('exports the volumetric god rays component', () => {
    expect(typeof VolumetricGodRays).toBe('function');
  });
});
