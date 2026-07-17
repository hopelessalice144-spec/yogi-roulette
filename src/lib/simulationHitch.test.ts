import { describe, expect, it } from 'vitest';
import {
  isPhysicsHitch,
  PHYSICS_HITCH_DELTA,
  postHitchSimulationDelta,
} from './simulationHitch.js';

describe('simulationHitch', () => {
  it('detects large frame gaps', () => {
    expect(PHYSICS_HITCH_DELTA).toBe(0.2);
    expect(isPhysicsHitch(0.15)).toBe(false);
    expect(isPhysicsHitch(0.21)).toBe(true);
  });

  it('clamps post-hitch simulation delta', () => {
    expect(postHitchSimulationDelta(0.05)).toBe(0.05);
    expect(postHitchSimulationDelta(0.5)).toBeCloseTo(1 / 60, 10);
  });
});
