import { describe, expect, it } from 'vitest';
import { WheelSectorNeon } from './WheelSectorNeon.jsx';

describe('WheelSectorNeon', () => {
  it('exports the sector neon component', () => {
    expect(typeof WheelSectorNeon).toBe('function');
  });
});
