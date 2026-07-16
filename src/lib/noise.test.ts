import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { handheldSimplex, operatorBreathing, simplex3 } from './noise.js';

describe('noise', () => {
  describe('simplex3', () => {
    it('returns zero at the origin simplex corner', () => {
      expect(simplex3(0, 0, 0)).toBe(0);
    });

    it('stays within [-1, 1] across a sample lattice', () => {
      for (let x = -4; x <= 4; x += 0.5) {
        for (let y = -4; y <= 4; y += 0.5) {
          for (let z = -4; z <= 4; z += 1) {
            const v = simplex3(x, y, z);
            expect(v).toBeGreaterThanOrEqual(-1);
            expect(v).toBeLessThanOrEqual(1);
          }
        }
      }
    });

    it('is stable for repeated evaluation at the same coordinate', () => {
      const sample = simplex3(2.5, -1.25, 0.75);
      expect(simplex3(2.5, -1.25, 0.75)).toBe(sample);
      expect(simplex3(2.5, -1.25, 0.75)).toBe(sample);
    });

    it('varies with input position', () => {
      const a = simplex3(0.25, 0.5, 0.75);
      const b = simplex3(3.25, 0.5, 0.75);
      expect(a).not.toBe(b);
    });
  });

  describe('operatorBreathing', () => {
    it('returns a THREE.Vector3 displacement', () => {
      const v = operatorBreathing(1.2);
      expect(v).toBeInstanceOf(THREE.Vector3);
      expect(Number.isFinite(v.x)).toBe(true);
      expect(Number.isFinite(v.y)).toBe(true);
      expect(Number.isFinite(v.z)).toBe(true);
    });

    it('has zero X displacement at t=0', () => {
      const v = operatorBreathing(0, 1);
      expect(v.x).toBe(0);
    });

    it('scales linearly with amplitude', () => {
      const base = operatorBreathing(1.5, 0.006).clone();
      const doubled = operatorBreathing(1.5, 0.012);

      expect(doubled.x).toBeCloseTo(base.x * 2, 10);
      expect(doubled.y).toBeCloseTo(base.y * 2, 10);
      expect(doubled.z).toBeCloseTo(base.z * 2, 10);
    });

    it('produces sub-millimeter micro-vibration at default amplitude', () => {
      const v = operatorBreathing(1.5);
      expect(v.length()).toBeLessThan(0.01);
      expect(v.length()).toBeGreaterThan(0);
    });
  });

  describe('handheldSimplex', () => {
    it('returns a THREE.Vector3 offset', () => {
      const v = handheldSimplex(4.2);
      expect(v).toBeInstanceOf(THREE.Vector3);
    });

    it('scales linearly with amplitude', () => {
      const base = handheldSimplex(3.1, 0.02).clone();
      const half = handheldSimplex(3.1, 0.01);

      expect(half.x).toBeCloseTo(base.x * 0.5, 10);
      expect(half.y).toBeCloseTo(base.y * 0.5, 10);
      expect(half.z).toBeCloseTo(base.z * 0.5, 10);
    });

    it('changes over time for organic handheld motion', () => {
      const early = handheldSimplex(1, 0.02).clone();
      const late = handheldSimplex(9, 0.02).clone();
      const delta =
        Math.abs(early.x - late.x) + Math.abs(early.y - late.y) + Math.abs(early.z - late.z);

      expect(delta).toBeGreaterThan(0.001);
    });
  });
});
