import { describe, expect, it } from 'vitest';
import { createWheelNumberRingTexture, wheelNumberRingRadius } from './wheelNumberRingTexture.js';

describe('wheelNumberRingTexture', () => {
  it('exports texture factory and ring radius', () => {
    expect(typeof createWheelNumberRingTexture).toBe('function');
    expect(wheelNumberRingRadius()).toBeGreaterThan(0.8);
  });
});
