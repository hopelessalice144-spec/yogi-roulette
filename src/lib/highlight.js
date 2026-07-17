import { RED_NUMBERS, BLACK_NUMBERS } from './math.js';
import { insideNumbers } from './insideBets.js';
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
    case 'split':
    case 'street':
    case 'corner':
    case 'line':
      return insideNumbers(type, value);
    case 'wheel-set': {
      if (value === undefined || value === null || value === '') return [];
      return String(value)
        .split(',')
        .map((part) => Number(part.trim()))
        .filter((n) => Number.isInteger(n) && n >= 0 && n <= 36);
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
    case 'column':
      return '#77bbff';
    case 'split':
      return '#66ffee';
    case 'street':
      return '#88ddff';
    case 'corner':
      return '#ffcc77';
    case 'line':
      return '#ffaa88';
    case 'wheel-set':
      return '#00e8c8';
    default:
      return '#ffaa44';
  }
}

/** Theme-aware neon color for 3D wheel sector lights. */
export function neonGlowColorForHighlight(highlight, uiTheme = 'lounge') {
  if (!highlight?.type) {
    if (uiTheme === 'neon') return '#ff7ec8';
    if (uiTheme === 'light') return '#c9a227';
    return '#ffaa44';
  }
  if (uiTheme === 'light') {
    switch (highlight.type) {
      case 'red':
        return '#c62828';
      case 'black':
        return '#37474f';
      case 'straight':
        return highlight.value === 0 ? '#00796b' : '#b8860b';
      case 'wheel-set':
        return '#00796b';
      case 'split':
      case 'street':
      case 'corner':
      case 'line':
        return '#8d6e14';
      case 'dozen':
      case 'column':
        return '#5d4e37';
      default:
        return '#b8860b';
    }
  }
  if (uiTheme === 'neon') {
    switch (highlight.type) {
      case 'red':
        return '#ff2d95';
      case 'black':
        return '#66ccff';
      case 'straight':
        return highlight.value === 0 ? '#00ffff' : '#ffe566';
      case 'wheel-set':
        return '#00ffff';
      case 'split':
      case 'street':
      case 'corner':
      case 'line':
        return '#ff9ed8';
      case 'dozen':
      case 'column':
        return '#c084fc';
      default:
        return '#ff7ec8';
    }
  }
  return warmGlowColorForHighlight(highlight);
}

/** Evenly sample pocket indices when highlight spans more than max slots. */
export function samplePocketIndices(indices, max = 20) {
  const list = [...indices].sort((a, b) => a - b);
  if (list.length <= max) return list;
  const out = [];
  const step = list.length / max;
  for (let i = 0; i < max; i += 1) {
    out.push(list[Math.floor(i * step)]);
  }
  return out;
}
