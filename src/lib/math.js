import { insideNumbers } from './insideBets.js';

export const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

export const BLACK_NUMBERS = new Set([
  2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35,
]);

export const PAYOUTS = Object.freeze({
  straight: 35,
  split: 17,
  street: 11,
  corner: 8,
  sixLine: 5,
  column: 2,
  dozen: 2,
  red: 1,
  black: 1,
  odd: 1,
  even: 1,
  low: 1,
  high: 1,
});

export function getColor(n) {
  if (n === 0) return 'green';
  if (RED_NUMBERS.has(n)) return 'red';
  if (BLACK_NUMBERS.has(n)) return 'black';
  throw new Error(`Invalid roulette number: ${n}`);
}

export function spin() {
  const number = Math.floor(Math.random() * 37);
  return { number, color: getColor(number) };
}

export function evaluateBet(bet, winningNumber) {
  const win = Math.floor(Number(winningNumber));
  if (!Number.isInteger(win) || win < 0 || win > 36) return 0;

  const amount = Math.floor(Number(bet?.amount));
  if (!Number.isInteger(amount) || amount <= 0) return 0;

  const { type, value } = bet;
  const color = getColor(win);
  let won = false;
  let ratio = 0;

  switch (type) {
    case 'straight':
      won = win === Math.floor(Number(value));
      ratio = PAYOUTS.straight;
      break;
    case 'red':
      won = color === 'red';
      ratio = PAYOUTS.red;
      break;
    case 'black':
      won = color === 'black';
      ratio = PAYOUTS.black;
      break;
    case 'odd':
      won = win !== 0 && win % 2 === 1;
      ratio = PAYOUTS.odd;
      break;
    case 'even':
      won = win !== 0 && win % 2 === 0;
      ratio = PAYOUTS.even;
      break;
    case 'low':
      won = win >= 1 && win <= 18;
      ratio = PAYOUTS.low;
      break;
    case 'high':
      won = win >= 19 && win <= 36;
      ratio = PAYOUTS.high;
      break;
    case 'dozen': {
      const d = Number(value);
      if (d === 1) won = win >= 1 && win <= 12;
      else if (d === 2) won = win >= 13 && win <= 24;
      else if (d === 3) won = win >= 25 && win <= 36;
      ratio = PAYOUTS.dozen;
      break;
    }
    case 'column': {
      const c = Number(value);
      won = win !== 0 && ((win - 1) % 3) + 1 === c;
      ratio = PAYOUTS.column;
      break;
    }
    case 'split':
    case 'street':
    case 'corner':
    case 'line': {
      const covered = insideNumbers(type, value);
      won = covered.includes(win);
      ratio = type === 'line' ? PAYOUTS.sixLine : PAYOUTS[type];
      break;
    }
    default:
      throw new Error(`Unknown bet type: ${type}`);
  }

  if (!won) return 0;
  return amount + amount * ratio;
}

console.assert(getColor(0) === 'green', '0 green');
console.assert(PAYOUTS.straight === 35, '35:1');
