import { describe, expect, it } from 'vitest';
import { LockPhaseBanner } from './LockPhaseBanner.jsx';

describe('LockPhaseBanner', () => {
  it('exports the lock phase banner component', () => {
    expect(typeof LockPhaseBanner).toBe('function');
  });
});
