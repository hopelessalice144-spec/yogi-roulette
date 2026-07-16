import { describe, expect, it } from 'vitest';
import { WinParticles } from './WinParticles.jsx';

describe('WinParticles', () => {
  it('exports the win particles component', () => {
    expect(typeof WinParticles).toBe('function');
  });
});
