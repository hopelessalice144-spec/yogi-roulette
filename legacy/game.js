/**
 * Turbo Roulette — Core Math Engine
 * European single-zero wheel (0–36) with standard payout ratios.
 */

const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

const BLACK_NUMBERS = new Set([
  2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35,
]);

/** Payout ratios as net profit multiplier (excludes stake return). */
const PAYOUTS = Object.freeze({
  straight: 35, // Single number 35:1
  split: 17,
  street: 11,
  corner: 8,
  sixLine: 5,
  column: 2,
  dozen: 2,
  red: 1, // 1:1
  black: 1,
  odd: 1,
  even: 1,
  low: 1, // 1–18
  high: 1, // 19–36
});

/**
 * @param {number} n
 * @returns {'red'|'black'|'green'}
 */
function getColor(n) {
  if (n === 0) return 'green';
  if (RED_NUMBERS.has(n)) return 'red';
  if (BLACK_NUMBERS.has(n)) return 'black';
  throw new Error(`Invalid roulette number: ${n}`);
}

/**
 * Spin the European wheel using Math.random().
 * @returns {{ number: number, color: 'red'|'black'|'green' }}
 */
function spin() {
  const number = Math.floor(Math.random() * 37); // 0–36 inclusive
  return { number, color: getColor(number) };
}

/**
 * Evaluate a bet against a winning number.
 * Returns total returned to player (stake + profit), or 0 if lost.
 *
 * @param {{ type: string, value?: number|string, amount: number }} bet
 * @param {number} winningNumber
 * @returns {number}
 */
function evaluateBet(bet, winningNumber) {
  const { type, value, amount } = bet;
  if (!amount || amount <= 0) return 0;

  const color = getColor(winningNumber);
  let won = false;
  let ratio = 0;

  switch (type) {
    case 'straight':
      won = winningNumber === value;
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
      won = winningNumber !== 0 && winningNumber % 2 === 1;
      ratio = PAYOUTS.odd;
      break;
    case 'even':
      won = winningNumber !== 0 && winningNumber % 2 === 0;
      ratio = PAYOUTS.even;
      break;
    case 'low':
      won = winningNumber >= 1 && winningNumber <= 18;
      ratio = PAYOUTS.low;
      break;
    case 'high':
      won = winningNumber >= 19 && winningNumber <= 36;
      ratio = PAYOUTS.high;
      break;
    case 'dozen': {
      // value: 1 | 2 | 3  →  1–12 | 13–24 | 25–36
      const d = Number(value);
      if (d === 1) won = winningNumber >= 1 && winningNumber <= 12;
      else if (d === 2) won = winningNumber >= 13 && winningNumber <= 24;
      else if (d === 3) won = winningNumber >= 25 && winningNumber <= 36;
      ratio = PAYOUTS.dozen;
      break;
    }
    case 'column': {
      // value: 1 | 2 | 3  →  numbers where n % 3 === value (with 0 excluded)
      const c = Number(value);
      won = winningNumber !== 0 && ((winningNumber - 1) % 3) + 1 === c;
      ratio = PAYOUTS.column;
      break;
    }
    default:
      throw new Error(`Unknown bet type: ${type}`);
  }

  if (!won) return 0;
  // Stake returned + profit at ratio:R
  return amount + amount * ratio;
}

/**
 * Net profit for a winning bet (does not include original stake).
 * Useful for asserting classic casino ratios like 35:1 / 1:1.
 */
function getNetProfit(bet, winningNumber) {
  const returned = evaluateBet(bet, winningNumber);
  if (returned === 0) return 0;
  return returned - bet.amount;
}

// --- Self-verification (console.assert) ---
(function selfTest() {
  console.assert(getColor(0) === 'green', '0 should be green');
  console.assert(getColor(1) === 'red', '1 should be red');
  console.assert(getColor(2) === 'black', '2 should be black');
  console.assert(PAYOUTS.straight === 35, 'Straight pays 35:1');
  console.assert(PAYOUTS.red === 1, 'Red pays 1:1');
  console.assert(PAYOUTS.black === 1, 'Black pays 1:1');

  const straightWin = getNetProfit({ type: 'straight', value: 17, amount: 10 }, 17);
  console.assert(straightWin === 350, `Straight 35:1 failed: got ${straightWin}`);

  const redWin = getNetProfit({ type: 'red', amount: 10 }, 1);
  console.assert(redWin === 10, `Red 1:1 failed: got ${redWin}`);

  const redLoseOnZero = evaluateBet({ type: 'red', amount: 10 }, 0);
  console.assert(redLoseOnZero === 0, 'Even-money bets lose on 0');

  const oddLoseOnZero = evaluateBet({ type: 'odd', amount: 5 }, 0);
  console.assert(oddLoseOnZero === 0, 'Odd loses on 0');
})();

// CommonJS for Node tests; also attach to window for browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    RED_NUMBERS,
    BLACK_NUMBERS,
    PAYOUTS,
    getColor,
    spin,
    evaluateBet,
    getNetProfit,
  };
}
if (typeof window !== 'undefined') {
  window.RouletteMath = {
    RED_NUMBERS,
    BLACK_NUMBERS,
    PAYOUTS,
    getColor,
    spin,
    evaluateBet,
    getNetProfit,
  };
}
