import { describe, expect, it } from 'vitest';
import { InstancedPins } from './WheelInstanced.jsx';

describe('WheelInstanced', () => {
  it('exports the instanced pins component', () => {
    expect(typeof InstancedPins).toBe('function');
  });
});
