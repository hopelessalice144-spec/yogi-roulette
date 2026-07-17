/**
 * Session statistics — hot/cold numbers, P/L series, progression hints.
 */

const SESSION_KEY = 'turboRoulette.sessionRounds';
export const MAX_SESSION_ROUNDS = 60;

export function emptySessionRounds() {
  return [];
}

export function appendSessionRound(rounds, round) {
  const entry = {
    cycleId: Math.floor(Number(round.cycleId)),
    number: Math.floor(Number(round.number)),
    color: round.color ?? null,
    net: Math.floor(Number(round.net) || 0),
    risked: Math.floor(Number(round.risked) || 0),
    at: round.at ?? Date.now(),
  };
  if (!Number.isInteger(entry.cycleId) || !Number.isInteger(entry.number)) return rounds;
  if (entry.number < 0 || entry.number > 36) return rounds;
  const next = [entry, ...rounds.filter((r) => r.cycleId !== entry.cycleId)];
  return next.slice(0, MAX_SESSION_ROUNDS);
}

export function loadSessionRounds() {
  if (typeof sessionStorage === 'undefined') return emptySessionRounds();
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return emptySessionRounds();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return emptySessionRounds();
    return parsed
      .filter(
        (r) =>
          r &&
          Number.isInteger(r.cycleId) &&
          Number.isInteger(r.number) &&
          r.number >= 0 &&
          r.number <= 36
      )
      .slice(0, MAX_SESSION_ROUNDS);
  } catch {
    return emptySessionRounds();
  }
}

export function saveSessionRounds(rounds) {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(rounds.slice(0, MAX_SESSION_ROUNDS)));
  } catch {
    /* quota / private mode */
  }
}

export function numberFrequency(rounds) {
  const freq = Array.from({ length: 37 }, (_, n) => ({ number: n, count: 0 }));
  for (const round of rounds) {
    if (Number.isInteger(round.number) && round.number >= 0 && round.number <= 36) {
      freq[round.number].count += 1;
    }
  }
  return freq;
}

export function hotColdNumbers(rounds, top = 5) {
  const freq = numberFrequency(rounds);
  const hot = [...freq]
    .filter((f) => f.count > 0)
    .sort((a, b) => b.count - a.count || a.number - b.number)
    .slice(0, top);
  const cold = [...freq]
    .sort((a, b) => a.count - b.count || a.number - b.number)
    .slice(0, top);
  return { hot, cold, spins: rounds.length };
}

const HEAT_MIN_SPINS = 3;

/** Per-pocket heat tier for racetrack heatmap tinting. */
export function wheelHeatLevels(rounds) {
  const levels = new Map();
  if (!rounds?.length || rounds.length < HEAT_MIN_SPINS) {
    for (let n = 0; n <= 36; n += 1) levels.set(n, 'neutral');
    return { levels, spins: rounds?.length ?? 0, ready: false };
  }

  const freq = numberFrequency(rounds);
  const maxCount = Math.max(1, ...freq.map((f) => f.count));
  const { hot, cold } = hotColdNumbers(rounds, 7);
  const hotSet = new Set(hot.map((h) => h.number));
  const coldCutoff = cold[Math.min(4, cold.length - 1)]?.count ?? 0;

  for (const { number, count } of freq) {
    if (hotSet.has(number) && count >= maxCount * 0.7) {
      levels.set(number, 'hot');
    } else if (count === 0 || count <= coldCutoff) {
      levels.set(number, 'cold');
    } else if (count >= maxCount * 0.55) {
      levels.set(number, 'warm');
    } else if (count <= maxCount * 0.3) {
      levels.set(number, 'cool');
    } else {
      levels.set(number, 'neutral');
    }
  }

  return { levels, spins: rounds.length, ready: true };
}

export function sessionTotals(rounds) {
  let net = 0;
  let wins = 0;
  let losses = 0;
  let staked = 0;
  for (const r of rounds) {
    net += r.net ?? 0;
    staked += r.risked ?? 0;
    if (r.net > 0) wins += 1;
    else if (r.net < 0) losses += 1;
  }
  return { net, wins, losses, staked, spins: rounds.length };
}

/** Cumulative P/L oldest→newest for sparkline (last 24 rounds). */
export function plSeries(rounds, limit = 24) {
  const slice = [...rounds].reverse().slice(-limit);
  let cumulative = 0;
  return slice.map((r) => {
    cumulative += r.net ?? 0;
    return { cycleId: r.cycleId, cumulative, net: r.net ?? 0 };
  });
}

/** Conservative progression helper — flat after win, step-up chip after loss. */
export function progressionAdvice({ rounds, chipValues, selectedChip, balance }) {
  const chips = [...chipValues].sort((a, b) => a - b);
  const base = chips.includes(selectedChip) ? selectedChip : chips[0] ?? 1;
  const safeBalance = Math.max(0, Math.floor(Number(balance) || 0));
  const last = rounds[0];

  if (!last) {
    return {
      mode: 'flat',
      chip: base,
      label: 'Flat betting — choose a base chip',
      detail: 'Stats populate after your first settled spin.',
    };
  }

  if (last.net >= 0 || last.risked <= 0) {
    return {
      mode: 'flat',
      chip: base,
      label: `Stay flat at $${base}`,
      detail: last.net > 0 ? `Last round +$${last.net}` : 'No wager last spin',
    };
  }

  const target = Math.min(base * 2, safeBalance);
  const chip =
    chips.find((c) => c >= target) ??
    chips.filter((c) => c <= safeBalance).pop() ??
    base;

  return {
    mode: 'recover',
    chip,
    label: chip > base ? `Step to $${chip}` : `Hold $${base}`,
    detail: `Lost $${last.risked} — optional recovery step (not auto-placed)`,
  };
}

/** Consecutive same-color results from most recent spin backward. */
export function colorStreak(recentResults) {
  if (!recentResults?.length) return { color: null, length: 0 };
  const color = recentResults[0].color;
  if (!color) return { color: null, length: 0 };
  let length = 0;
  for (const round of recentResults) {
    if (round.color !== color) break;
    length += 1;
  }
  return { color, length };
}

/** Consecutive winning rounds (net > 0) from most recent backward. */
export function winStreak(rounds) {
  if (!rounds?.length) return { length: 0, totalWon: 0 };
  let length = 0;
  let totalWon = 0;
  for (const round of rounds) {
    const net = Math.floor(Number(round.net) || 0);
    if (net <= 0) break;
    length += 1;
    totalWon += net;
  }
  return { length, totalWon };
}

console.assert(numberFrequency([{ number: 7 }, { number: 7 }])[7].count === 2, 'freq');
