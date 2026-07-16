import { RED_NUMBERS, BLACK_NUMBERS } from './math.js';
import { EUROPEAN_SEQUENCE } from './wheel.js';

/** Map UI hover bet → winning numbers on the wheel. */
export function numbersForHighlight({ type, value }) {
  if (!type) return [];
  switch (type) {
    case 'straight':
      return [Number(value)];
    case 'red':
      return [...RED_NUMBERS];
    case 'black':
      return [...BLACK_NUMBERS];
    case 'odd':
      return Array.from({ length: 18 }, (_, i) => i * 2 + 1);
    case 'even':
      return Array.from({ length: 18 }, (_, i) => (i + 1) * 2);
    case 'low':
      return Array.from({ length: 18 }, (_, i) => i + 1);
    case 'high':
      return Array.from({ length: 18 }, (_, i) => i + 19);
    case 'dozen': {
      const d = Number(value);
      if (d === 1) return Array.from({ length: 12 }, (_, i) => i + 1);
      if (d === 2) return Array.from({ length: 12 }, (_, i) => i + 13);
      return Array.from({ length: 12 }, (_, i) => i + 25);
    }
    case 'column': {
      const c = Number(value);
      return Array.from({ length: 12 }, (_, i) => i * 3 + c);
    }
    default:
      return [];
  }
}

export function pocketIndicesForHighlight(highlight) {
  if (!highlight?.type) return new Set();
  const indices = new Set();
  for (const n of numbersForHighlight(highlight)) {
    const idx = EUROPEAN_SEQUENCE.indexOf(n);
    if (idx >= 0) indices.add(idx);
  }
  return indices;
}

/** Divider pin indices flanking highlighted pockets (for 3D pin glow). */
export function dividerIndicesForHighlight(highlight) {
  const pockets = pocketIndicesForHighlight(highlight);
  if (pockets.size === 0) return new Set();
  const dividers = new Set();
  for (const idx of pockets) {
    dividers.add(idx);
    dividers.add((idx + 36) % 37);
    dividers.add((idx + 1) % 37);
  }
  return dividers;
}

/** Numbers lit on the 2D board for a hovered outside/straight bet. */
export function boardHighlightSet(hover) {
  if (!hover?.type) return new Set();
  return new Set(numbersForHighlight(hover));
}

/** Whether a straight-number cell should glow as part of a pathway. */
export function isStraightPathwayLit(number, hover) {
  if (!hover?.type) return false;
  if (hover.type === 'straight') return Number(hover.value) === number;
  return boardHighlightSet(hover).has(number);
}

/** Whether an outside bet cell is the hover source. */
export function isOutsideSource(cell, hover) {
  if (!hover?.type || !cell?.type) return false;
  if (cell.type !== hover.type) return false;
  if (hover.value !== undefined) return cell.value === hover.value;
  return true;
}

/** Column index (1–3) for a number on the standard board layout. */
export function columnForNumber(n) {
  if (n === 0) return 0;
  return ((n - 1) % 3) + 1;
}

/** Row index (0=top row 3,12..36) for pathway line drawing. */
export function rowForNumber(n) {
  if (n === 0) return -1;
  return Math.floor((n - 1) / 3);
}

/** Warm neon tint for 3D wheel sector glow (matches UI hover bet type). */
export function warmGlowColorForHighlight(highlight) {
  if (!highlight?.type) return '#ffaa44';
  switch (highlight.type) {
    case 'red':
      return '#ff5544';
    case 'black':
      return '#88aaff';
    case 'straight':
      return highlight.value === 0 ? '#44ffbb' : '#ffcc66';
    case 'even':
    case 'odd':
      return '#ff9955';
    case 'low':
    case 'high':
      return '#ffbb55';
    case 'dozen':
      return '#ff8866';
    default:
      return '#ffaa44';
  }
}
