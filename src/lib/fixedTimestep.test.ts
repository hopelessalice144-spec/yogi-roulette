import { describe, expect, it, vi } from 'vitest';
import {
  createTimestepAccumulator,
  FIXED_TIMESTEP,
  MAX_FRAME_DELTA,
  MAX_PHYSICS_SUBSTEPS,
  runFixedSteps,
} from './fixedTimestep.js';

describe('fixedTimestep', () => {
  it('exports 60Hz fixed-step constants', () => {
    expect(FIXED_TIMESTEP).toBeCloseTo(1 / 60, 10);
    expect(MAX_PHYSICS_SUBSTEPS).toBe(5);
    expect(MAX_FRAME_DELTA).toBe(0.1);
  });

  it('creates a zeroed accumulator', () => {
    expect(createTimestepAccumulator()).toEqual({ value: 0 });
  });

  describe('runFixedSteps', () => {
    it('runs at least one step for a typical frame delta', () => {
      const acc = createTimestepAccumulator();
      const stepFn = vi.fn();
      const steps = runFixedSteps(acc, 0.05, stepFn);
      expect(steps).toBeGreaterThanOrEqual(1);
      expect(stepFn).toHaveBeenCalledWith(FIXED_TIMESTEP);
    });

    it('passes fixed timestep to each step callback', () => {
      const acc = createTimestepAccumulator();
      const dtValues: number[] = [];
      runFixedSteps(acc, FIXED_TIMESTEP * 2, (dt: number) => dtValues.push(dt));
      expect(dtValues).toEqual([FIXED_TIMESTEP, FIXED_TIMESTEP]);
    });

    it('ignores negative frame deltas', () => {
      const acc = createTimestepAccumulator();
      const stepFn = vi.fn();
      expect(runFixedSteps(acc, -0.02, stepFn)).toBe(0);
      expect(acc.value).toBe(0);
      expect(stepFn).not.toHaveBeenCalled();
    });

    it('clamps oversized frame deltas', () => {
      const acc = createTimestepAccumulator();
      const stepFn = vi.fn();
      const steps = runFixedSteps(acc, 1, stepFn);
      expect(steps).toBe(MAX_PHYSICS_SUBSTEPS);
      expect(stepFn).toHaveBeenCalledTimes(MAX_PHYSICS_SUBSTEPS);
      expect(acc.value).toBeCloseTo(MAX_FRAME_DELTA - MAX_PHYSICS_SUBSTEPS * FIXED_TIMESTEP, 10);
    });

    it('carries leftover time between frames', () => {
      const acc = createTimestepAccumulator();
      const stepFn = vi.fn();
      runFixedSteps(acc, FIXED_TIMESTEP * 0.4, stepFn);
      expect(stepFn).not.toHaveBeenCalled();
      expect(acc.value).toBeCloseTo(FIXED_TIMESTEP * 0.4, 10);
      runFixedSteps(acc, FIXED_TIMESTEP * 0.7, stepFn);
      expect(stepFn).toHaveBeenCalledTimes(1);
      expect(acc.value).toBeCloseTo(FIXED_TIMESTEP * 0.1, 10);
    });

    it('returns zero when accumulated time is below one step', () => {
      const acc = createTimestepAccumulator();
      const stepFn = vi.fn();
      expect(runFixedSteps(acc, FIXED_TIMESTEP * 0.25, stepFn)).toBe(0);
      expect(stepFn).not.toHaveBeenCalled();
    });
  });
});
