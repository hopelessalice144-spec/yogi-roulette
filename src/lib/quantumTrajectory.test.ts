import { describe, expect, it } from 'vitest';
import { WHEEL } from './wheel.js';
import { computeQuantumArc, focusPocketPositions } from './quantumTrajectory.js';

const FREE_SAMPLE = {
  pos: { x: 0.5, y: 0.26, z: 1 },
  vel: { x: 0.8, y: 0, z: -0.3 },
  wheelAngle: 0.5,
  wheelSpinSpeed: 2,
  phase: 'free' as const,
  targetNumber: undefined,
  targetPocketIndex: undefined,
};

function pocketSum(pockets: Float32Array) {
  let total = 0;
  for (let i = 0; i < pockets.length; i++) total += pockets[i];
  return total;
}

describe('quantumTrajectory', () => {
  describe('computeQuantumArc', () => {
    it('returns an empty arc during orbit or at negligible speed', () => {
      const orbit = computeQuantumArc({ ...FREE_SAMPLE, phase: 'orbit' });
      expect(orbit.points).toEqual([]);
      expect(orbit.focusIndices).toEqual([]);
      expect(orbit.intensity).toBe(0);
      expect(orbit.spread).toBe(1);

      const slow = computeQuantumArc({
        ...FREE_SAMPLE,
        vel: { x: 0.01, y: 0, z: 0 },
      });
      expect(slow.points).toEqual([]);
      expect(slow.intensity).toBe(0);
    });

    it('samples arc points and pocket weights during free motion', () => {
      const arc = computeQuantumArc(FREE_SAMPLE);

      expect(arc.points.length).toBeGreaterThan(0);
      expect(arc.points[0]).toMatchObject({ x: FREE_SAMPLE.pos.x, t: 0 });
      expect(arc.focusIndices.length).toBeGreaterThanOrEqual(3);
      expect(arc.focusIndices.length).toBeLessThanOrEqual(6);
      expect(arc.pockets).toBeInstanceOf(Float32Array);
      expect(arc.pockets.length).toBe(37);
      expect(pocketSum(arc.pockets)).toBeCloseTo(1, 5);
      expect(arc.intensity).toBeGreaterThan(0);
      expect(arc.spread).toBeGreaterThan(0);
      expect(arc.speed).toBeCloseTo(Math.hypot(0.8, 0, -0.3), 8);
    });

    it('is deterministic for identical inputs', () => {
      const a = computeQuantumArc(FREE_SAMPLE);
      const b = computeQuantumArc(FREE_SAMPLE);

      expect(Array.from(a.pockets)).toEqual(Array.from(b.pockets));
      expect(a.focusIndices).toEqual(b.focusIndices);
      expect(a.points.length).toBe(b.points.length);
    });

    it('widens spread and lowers arc intensity as ball speed increases', () => {
      const slow = computeQuantumArc({
        ...FREE_SAMPLE,
        vel: { x: 0.3, y: 0, z: -0.1 },
      });
      const fast = computeQuantumArc({
        ...FREE_SAMPLE,
        vel: { x: 2.4, y: 0, z: -0.8 },
      });

      expect(fast.spread).toBeGreaterThan(slow.spread);
      expect(fast.intensity).toBeLessThan(slow.intensity);
    });

    it('boosts guided target pocket probability and extends arc endpoint', () => {
      const targetPocketIndex = 7;
      const guided = computeQuantumArc({
        ...FREE_SAMPLE,
        phase: 'guided',
        targetPocketIndex,
        targetNumber: undefined,
      });
      const free = computeQuantumArc(FREE_SAMPLE);

      expect(guided.pockets[targetPocketIndex]).toBeGreaterThan(free.pockets[targetPocketIndex]);
      expect(guided.points.at(-1)?.t).toBe(1);
    });

    it('orders focusIndices by descending pocket weight', () => {
      const arc = computeQuantumArc(FREE_SAMPLE);
      for (let i = 1; i < arc.focusIndices.length; i++) {
        const prev = arc.pockets[arc.focusIndices[i - 1]];
        const curr = arc.pockets[arc.focusIndices[i]];
        expect(prev).toBeGreaterThanOrEqual(curr);
      }
    });
  });

  describe('focusPocketPositions', () => {
    it('maps pocket indices to rim highlight coordinates', () => {
      const wheelAngle = 0.35;
      const focusIndices = [0, 7, 12];
      const positions = focusPocketPositions(focusIndices, wheelAngle);
      const rimRadius = WHEEL.trackRadius - 0.06;

      expect(positions).toHaveLength(3);
      for (let i = 0; i < positions.length; i++) {
        const p = positions[i];
        expect(p.idx).toBe(focusIndices[i]);
        expect(p.y).toBe(0.14);
        expect(Math.hypot(p.x, p.z)).toBeCloseTo(rimRadius, 5);
      }
    });

    it('rotates highlights with wheel angle', () => {
      const [atZero] = focusPocketPositions([3], 0);
      const [rotated] = focusPocketPositions([3], Math.PI / 4);
      const delta = Math.hypot(atZero.x - rotated.x, atZero.z - rotated.z);

      expect(delta).toBeGreaterThan(0.01);
    });
  });
});
