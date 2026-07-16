import { describe, expect, it } from 'vitest';
import {
  BALL_PHYSICS,
  EUROPEAN_SEQUENCE,
  POCKET_ANGLE,
  POCKET_CAPTURE,
  POCKET_COUNT,
  WHEEL,
  angleToPocketIndex,
  bowlSurfaceNormal,
  numberToPocketIndex,
  pocketCenterWorld,
  pocketIndexToAngle,
  pocketIndexToNumber,
  positionOnRing,
} from './wheel.js';

const STANDARD_SEQUENCE = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16,
  33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

describe('wheel', () => {
  describe('EUROPEAN_SEQUENCE', () => {
    it('uses the standard 37-pocket european order', () => {
      expect(EUROPEAN_SEQUENCE).toEqual(STANDARD_SEQUENCE);
      expect(POCKET_COUNT).toBe(37);
      expect(EUROPEAN_SEQUENCE[0]).toBe(0);
      expect(new Set(EUROPEAN_SEQUENCE).size).toBe(37);
    });

    it('derives pocket angle from pocket count', () => {
      expect(POCKET_ANGLE).toBeCloseTo((Math.PI * 2) / 37, 8);
    });
  });

  describe('pocket index mapping', () => {
    it('converts numbers and indices in both directions', () => {
      expect(pocketIndexToNumber(0)).toBe(0);
      expect(numberToPocketIndex(26)).toBe(36);
      for (let i = 0; i < POCKET_COUNT; i += 1) {
        const n = pocketIndexToNumber(i);
        expect(numberToPocketIndex(n)).toBe(i);
      }
    });

    it('throws on invalid numbers', () => {
      expect(() => numberToPocketIndex(37)).toThrow(/Invalid number/);
    });
  });

  describe('pocketIndexToAngle', () => {
    it('centers each pocket sector', () => {
      expect(pocketIndexToAngle(0)).toBeCloseTo(POCKET_ANGLE * 0.5, 8);
      expect(pocketIndexToAngle(1)).toBeCloseTo(POCKET_ANGLE * 1.5, 8);
    });
  });

  describe('angleToPocketIndex', () => {
    it('inverts pocket center angles modulo wheel wrap', () => {
      for (let i = 0; i < POCKET_COUNT; i += 1) {
        expect(angleToPocketIndex(pocketIndexToAngle(i))).toBe(i);
      }
      expect(angleToPocketIndex(pocketIndexToAngle(0) + Math.PI * 4)).toBe(0);
    });
  });

  describe('positionOnRing', () => {
    it('returns sin/cos coordinates on the XZ plane', () => {
      const [x, y, z] = positionOnRing(1, Math.PI / 2, 0.2);
      expect(x).toBeCloseTo(1, 6);
      expect(y).toBe(0.2);
      expect(z).toBeCloseTo(0, 6);
    });
  });

  describe('pocketCenterWorld', () => {
    it('offsets pocket angle by wheel rotation', () => {
      const center = pocketCenterWorld(0, 0.5);
      expect(center.y).toBe(POCKET_CAPTURE.nestleY);
      expect(center.angle).toBeCloseTo(pocketIndexToAngle(0) + 0.5, 8);
      const r = POCKET_CAPTURE.pocketMidRadius;
      expect(center.x).toBeCloseTo(Math.sin(center.angle) * r, 6);
      expect(center.z).toBeCloseTo(Math.cos(center.angle) * r, 6);
    });
  });

  describe('bowlSurfaceNormal', () => {
    it('returns a normalized inward slope vector', () => {
      const n = bowlSurfaceNormal(1, 0);
      const len = Math.hypot(n.x, n.y, n.z);
      expect(len).toBeCloseTo(1, 6);
      expect(n.x).toBeLessThan(0);
      expect(n.y).toBeCloseTo(
        BALL_PHYSICS.bowlSlope / Math.hypot(1, BALL_PHYSICS.bowlSlope, 0),
        4,
      );
    });
  });

  describe('presets', () => {
    it('exposes frozen wheel geometry and ball physics', () => {
      expect(WHEEL.outerRadius).toBeGreaterThan(WHEEL.hubRadius);
      expect(BALL_PHYSICS.mass).toBe(0.062);
      expect(BALL_PHYSICS.radius).toBeGreaterThan(0);
      expect(POCKET_CAPTURE.captureRadius).toBeLessThan(POCKET_CAPTURE.guideRadius);
    });
  });
});
