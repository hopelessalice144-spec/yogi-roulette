import { describe, expect, it } from 'vitest';
import {
  buildInsideBetZones,
  encodeInsideValue,
  insideNumbers,
  numberAt,
  validateInsideBet,
} from './insideBets.js';

describe('insideBets', () => {
  it('maps board coordinates to pocket numbers', () => {
    expect(numberAt(2, 0)).toBe(1);
    expect(numberAt(1, 0)).toBe(2);
    expect(numberAt(0, 0)).toBe(3);
    expect(numberAt(0, 11)).toBe(36);
  });

  it('validates canonical inside bet keys', () => {
    expect(validateInsideBet('split', '1,2')).toBe(true);
    expect(validateInsideBet('split', '0,1')).toBe(true);
    expect(validateInsideBet('split', '1,3')).toBe(false);
    expect(validateInsideBet('street', '1,2,3')).toBe(true);
    expect(validateInsideBet('street', '2,3,4')).toBe(false);
    expect(validateInsideBet('corner', '1,2,4,5')).toBe(true);
    expect(validateInsideBet('line', '1,2,3,4,5,6')).toBe(true);
    expect(validateInsideBet('line', '1,2,3,4,5,7')).toBe(false);
  });

  it('encodes sorted inside values', () => {
    expect(encodeInsideValue([2, 1])).toBe('1,2');
    expect(insideNumbers('split', '2,1')).toEqual([1, 2]);
  });

  it('builds a full inside zone catalog', () => {
    const zones = buildInsideBetZones();
    expect(zones.some((z) => z.type === 'split' && z.value === '1,2')).toBe(true);
    expect(zones.some((z) => z.type === 'street' && z.value === '1,2,3')).toBe(true);
    expect(zones.some((z) => z.type === 'corner' && z.value === '1,2,4,5')).toBe(true);
    expect(zones.some((z) => z.type === 'line' && z.value === '1,2,3,4,5,6')).toBe(true);
    expect(zones.filter((z) => z.type === 'street')).toHaveLength(12);
  });
});
