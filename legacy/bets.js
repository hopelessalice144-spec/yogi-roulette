/**
 * Turbo Roulette — Bet state helpers (shared by UI + tests).
 */

const CHIP_VALUES = Object.freeze([1, 5, 25, 100, 500]);

/**
 * Deterministic spin for a cycle id (live-sync: same cycle → same result).
 * @param {number} cycleId
 * @param {(n: number) => string} getColorFn
 */
function spinForCycle(cycleId, getColorFn) {
  // Simple LCG seeded by cycleId for stable cross-client results
  let s = (cycleId * 1664525 + 1013904223) >>> 0;
  s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
  const number = s % 37;
  return { number, color: getColorFn(number), cycleId };
}

/**
 * Merge a chip onto existing bets (same type+value stacks).
 * @param {Array} bets
 * @param {{ type: string, value?: number|string }} target
 * @param {number} chip
 */
function placeChip(bets, target, chip) {
  if (!chip || chip <= 0) return bets;
  const next = bets.map((b) => ({ ...b }));
  const idx = next.findIndex(
    (b) => b.type === target.type && b.value === target.value
  );
  if (idx >= 0) {
    next[idx] = { ...next[idx], amount: next[idx].amount + chip };
  } else {
    next.push({ type: target.type, value: target.value, amount: chip });
  }
  return next;
}

function totalStaked(bets) {
  return bets.reduce((sum, b) => sum + b.amount, 0);
}

/**
 * Settle all bets; returns total returned to player.
 */
function settleAll(bets, winningNumber, evaluateBetFn) {
  return bets.reduce((sum, bet) => sum + evaluateBetFn(bet, winningNumber), 0);
}

/**
 * Build European board cell descriptors (for UI + tests).
 */
function buildBoardCells(getColorFn) {
  const straights = [];
  for (let n = 0; n <= 36; n++) {
    straights.push({
      type: 'straight',
      value: n,
      label: String(n),
      color: getColorFn(n),
    });
  }
  const outside = [
    { type: 'dozen', value: 1, label: '1st 12' },
    { type: 'dozen', value: 2, label: '2nd 12' },
    { type: 'dozen', value: 3, label: '3rd 12' },
    { type: 'column', value: 1, label: '2:1' },
    { type: 'column', value: 2, label: '2:1' },
    { type: 'column', value: 3, label: '2:1' },
    { type: 'low', label: '1–18' },
    { type: 'even', label: 'EVEN' },
    { type: 'red', label: 'RED' },
    { type: 'black', label: 'BLACK' },
    { type: 'odd', label: 'ODD' },
    { type: 'high', label: '19–36' },
  ];
  return { straights, outside };
}

(function selfTest() {
  const color = (n) => (n === 0 ? 'green' : n % 2 ? 'red' : 'black');
  const a = spinForCycle(42, color);
  const b = spinForCycle(42, color);
  console.assert(a.number === b.number, 'Same cycle → same spin');
  console.assert(a.number >= 0 && a.number <= 36, 'Seeded spin in range');

  let bets = [];
  bets = placeChip(bets, { type: 'straight', value: 17 }, 5);
  bets = placeChip(bets, { type: 'straight', value: 17 }, 5);
  console.assert(bets.length === 1 && bets[0].amount === 10, 'Chips stack');
  console.assert(totalStaked(bets) === 10, 'Total staked');
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CHIP_VALUES,
    spinForCycle,
    placeChip,
    totalStaked,
    settleAll,
    buildBoardCells,
  };
}
if (typeof window !== 'undefined') {
  window.RouletteBets = {
    CHIP_VALUES,
    spinForCycle,
    placeChip,
    totalStaked,
    settleAll,
    buildBoardCells,
  };
}
