import { describe, expect, it } from 'vitest';
import { VIPLighting } from './VIPLighting.jsx';

describe('VIPLighting', () => {
  it('exports the vip lighting component', () => {
    expect(typeof VIPLighting).toBe('function');
  });
});
