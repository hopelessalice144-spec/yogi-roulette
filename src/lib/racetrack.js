/**
 * European racetrack layout — wheel-order geometry and announced (call) bets.
 */

import { EUROPEAN_SEQUENCE } from './wheel.js';
import { encodeInsideValue } from './insideBets.js';

const POCKET_COUNT = EUROPEAN_SEQUENCE.length;

/** Numbers covered by each classic racetrack sector. */
export const RACETRACK_SECTORS = Object.freeze({
  voisins: Object.freeze({
    id: 'voisins',
    label: 'Voisins du Zéro',
    short: 'Voisins',
    numbers: Object.freeze([
      22, 18, 29, 7, 28, 12, 35, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25,
    ]),
    legs: Object.freeze([
      { type: 'split', value: encodeInsideValue([0, 3]), units: 2 },
      { type: 'split', value: encodeInsideValue([4, 7]), units: 1 },
      { type: 'split', value: encodeInsideValue([12, 15]), units: 1 },
      { type: 'split', value: encodeInsideValue([18, 21]), units: 1 },
      { type: 'split', value: encodeInsideValue([19, 22]), units: 1 },
      { type: 'split', value: encodeInsideValue([32, 35]), units: 1 },
      { type: 'straight', value: 2, units: 2 },
    ]),
  }),
  tiers: Object.freeze({
    id: 'tiers',
    label: 'Tiers du Cylindre',
    short: 'Tiers',
    numbers: Object.freeze([27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33]),
    legs: Object.freeze([
      { type: 'split', value: encodeInsideValue([5, 8]), units: 1 },
      { type: 'split', value: encodeInsideValue([10, 11]), units: 1 },
      { type: 'split', value: encodeInsideValue([13, 16]), units: 1 },
      { type: 'split', value: encodeInsideValue([23, 24]), units: 1 },
      { type: 'split', value: encodeInsideValue([27, 30]), units: 1 },
      { type: 'split', value: encodeInsideValue([33, 36]), units: 1 },
    ]),
  }),
  orphelins: Object.freeze({
    id: 'orphelins',
    label: 'Orphelins',
    short: 'Orphelins',
    numbers: Object.freeze([1, 20, 14, 31, 9, 17, 34, 6]),
    legs: Object.freeze([
      { type: 'straight', value: 1, units: 1 },
      { type: 'split', value: encodeInsideValue([6, 9]), units: 1 },
      { type: 'split', value: encodeInsideValue([14, 17]), units: 1 },
      { type: 'split', value: encodeInsideValue([17, 20]), units: 1 },
      { type: 'split', value: encodeInsideValue([31, 34]), units: 1 },
    ]),
  }),
  jeuZero: Object.freeze({
    id: 'jeuZero',
    label: 'Jeu Zéro',
    short: 'Jeu 0',
    numbers: Object.freeze([12, 35, 3, 26, 0, 32, 15]),
    legs: Object.freeze([
      { type: 'split', value: encodeInsideValue([0, 3]), units: 1 },
      { type: 'split', value: encodeInsideValue([12, 15]), units: 1 },
      { type: 'split', value: encodeInsideValue([32, 35]), units: 1 },
      { type: 'straight', value: 26, units: 1 },
    ]),
  }),
});

export const SECTOR_LIST = Object.freeze(Object.values(RACETRACK_SECTORS));

/** Wheel-order index for a pocket number. */
export function wheelIndex(number) {
  return EUROPEAN_SEQUENCE.indexOf(number);
}

/** Pocket numbers within ±radius on the physical wheel (inclusive). */
export function wheelNeighbors(number, radius = 2) {
  const idx = wheelIndex(number);
  if (idx < 0) return [];
  const out = [];
  for (let d = -radius; d <= radius; d += 1) {
    out.push(EUROPEAN_SEQUENCE[(idx + d + POCKET_COUNT) % POCKET_COUNT]);
  }
  return out;
}

/** Total chip units for a call-bet leg list. */
export function callBetUnits(legs) {
  return legs.reduce((sum, leg) => sum + (leg.units ?? 1), 0);
}

/** Map wheel index → normalized position on racetrack ellipse (0–1 coords). */
export function racetrackLayout(rx = 0.46, ry = 0.38) {
  return EUROPEAN_SEQUENCE.map((number, index) => {
    const angle = (index / POCKET_COUNT) * Math.PI * 2 - Math.PI / 2;
    return {
      number,
      index,
      x: 0.5 + Math.cos(angle) * rx,
      y: 0.5 + Math.sin(angle) * ry,
      angle,
    };
  });
}

/** Sector membership for heat-map tinting. */
export function sectorForNumber(number) {
  for (const sector of SECTOR_LIST) {
    if (sector.numbers.includes(number)) return sector.id;
  }
  return null;
}

/** Highlight payload for a racetrack sector hover. */
export function sectorHighlight(sectorId) {
  const sector = RACETRACK_SECTORS[sectorId];
  if (!sector) return null;
  return { type: 'wheel-set', value: sector.numbers.join(',') };
}

/** Highlight payload for wheel neighbors. */
export function neighborHighlight(number, radius) {
  return { type: 'wheel-set', value: wheelNeighbors(number, radius).join(',') };
}
