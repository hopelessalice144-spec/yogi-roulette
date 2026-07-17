import { describe, expect, it } from 'vitest';
import {
  callBetUnits,
  RACETRACK_SECTORS,
  wheelNeighbors,
} from './racetrack.js';

describe('racetrack', () => {
  it('returns wheel neighbors around a pocket', () => {
    const neighbors = wheelNeighbors(0, 1);
    expect(neighbors).toHaveLength(3);
    expect(neighbors).toContain(0);
  });

  it('defines call bet legs for tiers', () => {
    expect(callBetUnits(RACETRACK_SECTORS.tiers.legs)).toBe(6);
  });
});
