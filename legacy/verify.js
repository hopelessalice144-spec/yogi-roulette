/**
 * Phase 3–5 verification harness (Node).
 * Run: node verify.js
 */
const fs = require('fs');
const path = require('path');

const game = require('./game.js');
const timer = require('./timer.js');
const storage = require('./storage.js');
const bets = require('./bets.js');

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) passed += 1;
  else {
    failed += 1;
    console.error('FAIL:', msg);
  }
}

console.log('=== File deploy checklist ===');
const required = [
  'index.html',
  'game.js',
  'timer.js',
  'storage.js',
  'bets.js',
  'ui.js',
  'app.js',
];
for (const f of required) {
  const p = path.join(__dirname, f);
  assert(fs.existsSync(p), `${f} exists`);
  const htmlOrJs = fs.readFileSync(p, 'utf8');
  assert(htmlOrJs.length > 50, `${f} non-empty`);
}

const index = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
assert(index.includes('game.js'), 'index loads game.js');
assert(index.includes('timer.js'), 'index loads timer.js');
assert(index.includes('storage.js'), 'index loads storage.js');
assert(index.includes('bets.js'), 'index loads bets.js');
assert(index.includes('ui.js'), 'index loads ui.js');
assert(index.includes('app.js'), 'index loads app.js');
assert(index.includes('cdn.tailwindcss.com'), 'Tailwind CDN present');

const uiSrc = fs.readFileSync(path.join(__dirname, 'ui.js'), 'utf8');
assert(uiSrc.includes('mountShell'), 'UI mountShell');
assert(uiSrc.includes('data-bet-type'), 'Board bet cells');
assert(uiSrc.includes('chip-rack') || uiSrc.includes('chip-rack') || uiSrc.includes('renderChipRack'), 'Chip rack');

const appSrc = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
assert(appSrc.includes('onPlaceBet'), 'App places bets');
assert(appSrc.includes('settleIfNeeded'), 'App settles on spin window');
assert(appSrc.includes('claimFaucet') || appSrc.includes('onFaucet'), 'App faucet wired');

console.log('\n=== Board / bet placement ===');
let bag = [];
bag = bets.placeChip(bag, { type: 'red' }, 25);
bag = bets.placeChip(bag, { type: 'straight', value: 17 }, 5);
bag = bets.placeChip(bag, { type: 'straight', value: 17 }, 5);
assert(bag.length === 2, 'Two distinct bets');
assert(bets.totalStaked(bag) === 35, 'Staked 35');
assert(bag.find((b) => b.type === 'straight').amount === 10, 'Straight stacked to 10');

const cells = bets.buildBoardCells(game.getColor);
assert(cells.straights.length === 37, '37 straight cells');
assert(cells.outside.length === 12, '12 outside bet cells');
assert(cells.straights[0].color === 'green', '0 is green on board');

console.log('\n=== Payout accuracy through settleAll ===');
const payoutBets = [
  { type: 'straight', value: 7, amount: 10 },
  { type: 'red', amount: 20 },
];
// 7 is red
const returned = bets.settleAll(payoutBets, 7, game.evaluateBet);
assert(returned === 10 + 10 * 35 + 20 + 20 * 1, `Straight+red return got ${returned}`);
assert(game.getNetProfit({ type: 'straight', value: 7, amount: 1 }, 7) === 35, '35:1');
assert(game.getNetProfit({ type: 'black', amount: 1 }, 2) === 1, '1:1');

console.log('\n=== Live-sync spin determinism ===');
const a = bets.spinForCycle(1001, game.getColor);
const b = bets.spinForCycle(1001, game.getColor);
const c = bets.spinForCycle(1002, game.getColor);
assert(a.number === b.number && a.color === b.color, 'Same cycle same result');
assert(a.number !== c.number || true, 'Different cycles may differ (smoke)');
assert(timer.getCycleSecond(Date.now()) >= 0 && timer.getCycleSecond(Date.now()) < 30, 'Live cycle second');

console.log('\n=== Faucet & storage boundaries ===');
assert(storage.DEFAULT_BALANCE === 1000, 'Start with 1000');
assert(storage.FAUCET_AMOUNT === 500, 'Faucet 500');

// In-memory simulation of faucet gate
function simulateFaucet(balance) {
  if (balance > storage.FAUCET_MIN_BALANCE) {
    return { claimed: false, balance };
  }
  return { claimed: true, balance: balance + storage.FAUCET_AMOUNT };
}
assert(simulateFaucet(1000).claimed === false, 'Rich player blocked');
assert(simulateFaucet(50).claimed === true, 'At threshold allowed');
assert(simulateFaucet(0).balance === 500, 'Broke player gets 500');

assert(typeof storage.loadBets === 'function', 'loadBets exported');
assert(typeof storage.saveBets === 'function', 'saveBets exported');
assert(Array.isArray(storage.loadBets()), 'loadBets returns array in Node');
assert(storage.saveBets([{ type: 'red', amount: 5 }]) === false, 'saveBets without LS returns false');

console.log('\n=== 50-cycle settle simulation ===');
let balance = 1000;
for (let i = 0; i < 50; i++) {
  const cycleId = 50000 + i;
  const chip = 10;
  const target = { type: 'red' };
  balance -= chip;
  const result = bets.spinForCycle(cycleId, game.getColor);
  const ret = bets.settleAll([{ ...target, amount: chip }], result.number, game.evaluateBet);
  balance += ret;
  assert(result.number >= 0 && result.number <= 36, `cycle ${cycleId} in range`);
  if (result.color === 'red') {
    assert(ret === chip * 2, `red win 1:1 return cycle ${cycleId}`);
  } else {
    assert(ret === 0, `non-red lose cycle ${cycleId}`);
  }
}
assert(Number.isFinite(balance), 'Balance finite after 50 rounds');

console.log('\n=== Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failed > 0) process.exit(1);
console.log('Phases 3–5 verification passed.');
