import { describe, expect, it } from 'vitest';
import { VIPPostFX } from './VIPPostFX.jsx';

describe('VIPPostFX', () => {
  it('exports the vip post fx component', () => {
    expect(typeof VIPPostFX).toBe('function');
  });
});
