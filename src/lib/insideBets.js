/**
 * Inside bet definitions — split, street, corner, line (six-line).
 * Value encoding: sorted comma-separated pocket numbers, e.g. "1,2" or "1,2,3,4".
 */

export const INSIDE_BET_TYPES = Object.freeze(['split', 'street', 'corner', 'line']);

const COLS = 12;
const ROWS = 3;

/** Pocket at board row ri (0=top) and column ci (0=left). */
export function numberAt(ri, ci) {
  if (ri < 0 || ri >= ROWS || ci < 0 || ci >= COLS) return null;
  return ci * 3 + (3 - ri);
}

/** Canonical inside-bet value key. */
export function encodeInsideValue(numbers) {
  return [...numbers]
    .map((n) => Math.floor(Number(n)))
    .filter((n) => Number.isInteger(n))
    .sort((a, b) => a - b)
    .join(',');
}

export function parseInsideValue(value) {
  if (value === undefined || value === null || value === '') return null;
  const raw = String(value)
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((n) => Number.isInteger(n));
  return raw.length > 0 ? encodeInsideValue(raw).split(',').map(Number) : null;
}

function isAdjacentPair(a, b) {
  if (a === 0 && b >= 1 && b <= 3) return true;
  if (b === 0 && a >= 1 && a <= 3) return true;
  if (a < 1 || b < 1 || a > 36 || b > 36) return false;
  const [lo, hi] = a < b ? [a, b] : [b, a];
  if (hi - lo === 1 && Math.floor((lo - 1) / 3) === Math.floor((hi - 1) / 3)) return true;
  if (hi - lo === 3) return true;
  return false;
}

function isValidStreet(nums) {
  if (nums.length !== 3) return false;
  const sorted = [...nums].sort((a, b) => a - b);
  return sorted[0] + 1 === sorted[1] && sorted[1] + 1 === sorted[2] && sorted[0] % 3 === 1;
}

function isValidCorner(nums) {
  if (nums.length !== 4) return false;
  const sorted = [...nums].sort((a, b) => a - b);
  const set = new Set(sorted);
  if (set.size !== 4) return false;
  for (const n of sorted) {
    if (n < 1 || n > 36) return false;
  }
  const min = sorted[0];
  const max = sorted[3];
  if (max - min !== 4) return false;
  if (min % 3 === 0) return false;
  return set.has(min) && set.has(min + 1) && set.has(min + 3) && set.has(min + 4);
}

function isValidLine(nums) {
  if (nums.length !== 6) return false;
  const sorted = [...nums].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i] !== sorted[i - 1] + 1) return false;
  }
  return sorted[0] % 3 === 1 && sorted[0] <= 31;
}

export function validateInsideBet(type, value) {
  if (!INSIDE_BET_TYPES.includes(type)) return false;
  const nums = parseInsideValue(value);
  if (!nums) return false;

  switch (type) {
    case 'split':
      return nums.length === 2 && isAdjacentPair(nums[0], nums[1]);
    case 'street':
      return isValidStreet(nums);
    case 'corner':
      return isValidCorner(nums);
    case 'line':
      return isValidLine(nums);
    default:
      return false;
  }
}

export function insideNumbers(type, value) {
  const nums = parseInsideValue(value);
  if (!nums || !validateInsideBet(type, encodeInsideValue(nums))) return [];
  return nums;
}

/** UI zone descriptors for intersection overlays on the number grid. */
export function buildInsideBetZones() {
  const zones = [];

  for (let ri = 0; ri < ROWS; ri += 1) {
    for (let ci = 0; ci < COLS - 1; ci += 1) {
      const a = numberAt(ri, ci);
      const b = numberAt(ri, ci + 1);
      zones.push({
        kind: 'split-h',
        type: 'split',
        value: encodeInsideValue([a, b]),
        ri,
        ci,
        label: `${a}·${b}`,
      });
    }
  }

  for (let ri = 1; ri < ROWS; ri += 1) {
    for (let ci = 0; ci < COLS; ci += 1) {
      const a = numberAt(ri, ci);
      const b = numberAt(ri - 1, ci);
      zones.push({
        kind: 'split-v',
        type: 'split',
        value: encodeInsideValue([a, b]),
        ri,
        ci,
        label: `${Math.min(a, b)}·${Math.max(a, b)}`,
      });
    }
  }

  for (const b of [1, 2, 3]) {
    zones.push({
      kind: 'split-zero',
      type: 'split',
      value: encodeInsideValue([0, b]),
      label: `0·${b}`,
    });
  }

  for (let ci = 0; ci < COLS; ci += 1) {
    const nums = [numberAt(0, ci), numberAt(1, ci), numberAt(2, ci)];
    zones.push({
      kind: 'street',
      type: 'street',
      value: encodeInsideValue(nums),
      ci,
      label: nums.join('·'),
    });
  }

  for (let ri = 1; ri < ROWS; ri += 1) {
    for (let ci = 0; ci < COLS - 1; ci += 1) {
      const nums = [
        numberAt(ri, ci),
        numberAt(ri - 1, ci),
        numberAt(ri, ci + 1),
        numberAt(ri - 1, ci + 1),
      ];
      zones.push({
        kind: 'corner',
        type: 'corner',
        value: encodeInsideValue(nums),
        ri,
        ci,
        label: '▣',
      });
    }
  }

  for (let ci = 0; ci < COLS - 1; ci += 1) {
    const nums = [
      numberAt(0, ci),
      numberAt(1, ci),
      numberAt(2, ci),
      numberAt(0, ci + 1),
      numberAt(1, ci + 1),
      numberAt(2, ci + 1),
    ];
    zones.push({
      kind: 'line',
      type: 'line',
      value: encodeInsideValue(nums),
      ci,
      label: '═',
    });
  }

  return zones;
}

/** Percentage-based layout for absolute inside-zone buttons. */
export function insideZoneStyle(zone) {
  const colW = 100 / COLS;
  const rowH = 100 / ROWS;
  const hit = 5;

  switch (zone.kind) {
    case 'split-h':
      return {
        left: `calc(${(zone.ci + 1) * colW}% - ${hit / 2}%)`,
        top: `calc(${zone.ri * rowH}% + 6%)`,
        width: `${hit}%`,
        height: `calc(${rowH}% - 12%)`,
      };
    case 'split-v':
      return {
        left: `calc(${zone.ci * colW}% + ${colW / 2}% - ${hit / 2}%)`,
        top: `calc(${zone.ri * rowH}% - ${hit / 4}%)`,
        width: `${hit}%`,
        height: `${hit}%`,
      };
    case 'split-zero': {
      const pocket = Number(zone.value.split(',')[1]);
      const rowMap = { 1: 2, 2: 1, 3: 0 };
      const ri = rowMap[pocket] ?? 0;
      return {
        left: `-${hit}%`,
        top: `calc(${ri * rowH}% + ${rowH * 0.28}%)`,
        width: `${hit}%`,
        height: `${hit * 0.9}%`,
      };
    }
    case 'street':
      return {
        left: `calc(${(zone.ci + 1) * colW}% - ${hit / 3}%)`,
        top: '4%',
        width: `${hit * 0.85}%`,
        height: '92%',
      };
    case 'corner':
      return {
        left: `calc(${(zone.ci + 1) * colW}% - ${hit / 2}%)`,
        top: `calc(${zone.ri * rowH}% - ${hit / 3}%)`,
        width: `${hit}%`,
        height: `${hit}%`,
      };
    case 'line':
      return {
        left: `calc(${(zone.ci + 1) * colW}% - ${hit / 2}%)`,
        top: '2%',
        width: `${hit}%`,
        height: '96%',
      };
    default:
      return {};
  }
}

console.assert(validateInsideBet('split', '1,2'), 'split 1-2');
console.assert(validateInsideBet('street', '1,2,3'), 'street 1-2-3');
console.assert(validateInsideBet('corner', '1,2,4,5'), 'corner 1-2-4-5');
console.assert(validateInsideBet('line', '1,2,3,4,5,6'), 'line 1-6');
