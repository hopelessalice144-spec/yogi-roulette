/**
 * Deterministic ghost VIP lounge — procedural opponents synced to 30s cycle.
 */
import { CHIP_VALUES } from './bets.js';
import { evaluateBet } from './math.js';

export const GHOST_VIPS = Object.freeze([
  { id: 'aurora', name: 'Aurora', hue: 168 },
  { id: 'stacks', name: 'SirStacks', hue: 45 },
  { id: 'neon', name: 'NeonQueen', hue: 320 },
  { id: 'baron', name: 'CryptoBaron', hue: 210 },
  { id: 'velvet', name: 'VelvetFox', hue: 280 },
]);

const OUTSIDE_POOL = [
  { type: 'red' },
  { type: 'black' },
  { type: 'odd' },
  { type: 'even' },
  { type: 'low' },
  { type: 'high' },
  { type: 'dozen', value: 1 },
  { type: 'dozen', value: 2 },
  { type: 'dozen', value: 3 },
  { type: 'column', value: 1 },
  { type: 'column', value: 2 },
  { type: 'column', value: 3 },
];

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickTarget(rng) {
  if (rng() < 0.55) {
    const n = 1 + Math.floor(rng() * 36);
    return { type: 'straight', value: n };
  }
  const pool = OUTSIDE_POOL[Math.floor(rng() * OUTSIDE_POOL.length)];
  return { ...pool };
}

function pickChip(rng) {
  const weights = [0.35, 0.3, 0.22, 0.1, 0.03];
  let r = rng();
  for (let i = 0; i < CHIP_VALUES.length; i++) {
    r -= weights[i];
    if (r <= 0) return CHIP_VALUES[i];
  }
  return CHIP_VALUES[0];
}

function betKey(b) {
  return `${b.type}:${b.value ?? ''}`;
}

/**
 * Lightweight ghost betting simulation — fully deterministic per cycleId.
 */
export function createGhostEngine() {
  let cycleId = -1;
  let bets = [];
  let schedule = [];
  let confetti = [];
  let rng = mulberry32(1);

  function resetForCycle(id) {
    cycleId = id;
    bets = [];
    confetti = [];
    rng = mulberry32((id * 2654435761) >>> 0);
    const count = 3 + Math.floor(rng() * 3);
    const vipCount = Math.min(count, GHOST_VIPS.length);
    const usedVips = GHOST_VIPS.slice(0, vipCount);
    schedule = [];

    let t = 1.2 + rng() * 2;
    for (let i = 0; i < vipCount * 2 + Math.floor(rng() * 3); i++) {
      const vip = usedVips[i % vipCount];
      const target = pickTarget(rng);
      const amount = pickChip(rng);
      schedule.push({
        at: t,
        vipId: vip.id,
        vipName: vip.name,
        hue: vip.hue,
        target,
        amount,
      });
      t += 1.8 + rng() * 3.2;
    }
    schedule.sort((a, b) => a.at - b.at);
  }

  function tick(clock, winningNumber) {
    if (clock.cycleId !== cycleId) {
      resetForCycle(clock.cycleId);
    }

    if (clock.name === 'betting') {
      const sec = clock.cycleSecond;
      while (schedule.length > 0 && schedule[0].at <= sec) {
        const ev = schedule.shift();
        const key = betKey(ev.target);
        const existing = bets.find(
          (b) => b.vipId === ev.vipId && betKey(b) === key
        );
        if (existing) {
          existing.amount += ev.amount;
          existing.dropT = 0;
          existing.landed = false;
        } else {
          bets.push({
            id: `${cycleId}-${ev.vipId}-${key}-${bets.length}`,
            vipId: ev.vipId,
            vipName: ev.vipName,
            hue: ev.hue,
            type: ev.target.type,
            value: ev.target.value,
            amount: ev.amount,
            dropT: 0,
            landed: false,
          });
        }
      }

      for (const b of bets) {
        if (!b.landed) {
          b.dropT = Math.min(1, b.dropT + 0.09);
          if (b.dropT >= 1) b.landed = true;
        }
      }
    }

    if (clock.name === 'spinning' && clock.cycleSecond >= 29 && winningNumber != null) {
      if (confetti.length === 0) {
        for (const b of bets) {
          if (evaluateBet({ type: b.type, value: b.value, amount: 1 }, winningNumber) > 1) {
            confetti.push({
              id: `gc-${b.id}`,
              betId: b.id,
              hue: b.hue,
              type: b.type,
              value: b.value,
            });
          }
        }
      }
    }

    if (clock.name === 'betting' && clock.cycleSecond < 1) {
      confetti = [];
    }

    return { bets: [...bets], confetti: [...confetti] };
  }

  function ghostAmount(type, value) {
    return bets
      .filter((b) => b.type === type && b.value === value)
      .reduce((s, b) => s + b.amount, 0);
  }

  return { tick, ghostAmount, resetForCycle };
}
