/**
 * Turbo Roulette — Live-Sync Timer
 * Synchronizes game phases to wall-clock time via (unixSeconds % 30).
 * Cycle length: 30 seconds.
 */

const CYCLE_SECONDS = 30;

/** Phase windows within each 30s cycle (seconds remaining in cycle). */
const PHASES = Object.freeze({
  // Seconds 0–19 of cycle: open for bets
  BETTING: { start: 0, end: 20, name: 'betting' },
  // Seconds 20–24: bets locked, spin impending
  LOCKED: { start: 20, end: 25, name: 'locked' },
  // Seconds 25–29: spin / result reveal
  SPINNING: { start: 25, end: 30, name: 'spinning' },
});

/**
 * Seconds elapsed in the current 30s cycle based on system time.
 * @param {number} [nowMs=Date.now()]
 * @returns {number} 0–29
 */
function getCycleSecond(nowMs = Date.now()) {
  const unixSeconds = Math.floor(nowMs / 1000);
  return unixSeconds % CYCLE_SECONDS;
}

/**
 * Seconds remaining until the next cycle boundary (and next spin window).
 * @param {number} [nowMs=Date.now()]
 * @returns {number} 1–30
 */
function getSecondsRemaining(nowMs = Date.now()) {
  const elapsed = getCycleSecond(nowMs);
  return CYCLE_SECONDS - elapsed;
}

/**
 * Current game phase derived from system clock.
 * @param {number} [nowMs=Date.now()]
 * @returns {{ name: string, cycleSecond: number, secondsRemaining: number }}
 */
function getPhase(nowMs = Date.now()) {
  const cycleSecond = getCycleSecond(nowMs);
  let name = PHASES.SPINNING.name;

  if (cycleSecond >= PHASES.BETTING.start && cycleSecond < PHASES.BETTING.end) {
    name = PHASES.BETTING.name;
  } else if (cycleSecond >= PHASES.LOCKED.start && cycleSecond < PHASES.LOCKED.end) {
    name = PHASES.LOCKED.name;
  } else {
    name = PHASES.SPINNING.name;
  }

  return {
    name,
    cycleSecond,
    secondsRemaining: getSecondsRemaining(nowMs),
  };
}

/**
 * True when the clock is in the spinning window — safe moment to settle a spin.
 * All clients sharing wall-clock time land on the same cycle index.
 * @param {number} [nowMs=Date.now()]
 */
function isSpinWindow(nowMs = Date.now()) {
  return getPhase(nowMs).name === PHASES.SPINNING.name;
}

/**
 * Stable cycle id (unix epoch / 30) so clients can share deterministic spin seeds later.
 * @param {number} [nowMs=Date.now()]
 */
function getCycleId(nowMs = Date.now()) {
  return Math.floor(Math.floor(nowMs / 1000) / CYCLE_SECONDS);
}

// --- Self-verification (console.assert) ---
(function selfTest() {
  // Fixed timestamp: unix 1_000_000 → second 1_000_000 % 30 = 10
  const t = 1_000_000 * 1000;
  console.assert(getCycleSecond(t) === 10, `Expected cycle second 10, got ${getCycleSecond(t)}`);
  console.assert(getSecondsRemaining(t) === 20, `Expected 20 remaining, got ${getSecondsRemaining(t)}`);
  console.assert(getPhase(t).name === 'betting', 'Second 10 should be betting');

  const lockedT = (1_000_000 + 22) * 1000; // cycle second 2... wait: (1000000+22)%30
  // 1000000 % 30 = 10, so +22 → 32 → cycle second 2? No: (1000000+22)%30 = 32%30 = 2
  // Actually we need cycle second 22: base at cycleSecond 0
  const baseUnix = Math.floor(Date.UTC(2020, 0, 1) / 1000);
  const aligned = baseUnix - (baseUnix % CYCLE_SECONDS);
  console.assert(getCycleSecond(aligned * 1000) === 0, 'Aligned to cycle start');
  console.assert(getPhase((aligned + 22) * 1000).name === 'locked', 'Second 22 locked');
  console.assert(getPhase((aligned + 26) * 1000).name === 'spinning', 'Second 26 spinning');
  console.assert(getCycleId(aligned * 1000) === getCycleId((aligned + 29) * 1000), 'Same cycle id within window');
  console.assert(
    getCycleId(aligned * 1000) + 1 === getCycleId((aligned + 30) * 1000),
    'Cycle id increments every 30s'
  );
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CYCLE_SECONDS,
    PHASES,
    getCycleSecond,
    getSecondsRemaining,
    getPhase,
    isSpinWindow,
    getCycleId,
  };
}
if (typeof window !== 'undefined') {
  window.RouletteTimer = {
    CYCLE_SECONDS,
    PHASES,
    getCycleSecond,
    getSecondsRemaining,
    getPhase,
    isSpinWindow,
    getCycleId,
  };
}
