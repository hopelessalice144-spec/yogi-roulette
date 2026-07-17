import { describe, expect, it } from 'vitest';
import { CHIP_VALUES } from './bets.js';
import { createGhostEngine, GHOST_VIPS } from './ghostPlayers.js';

const CYCLE_42 = 42;

function advanceBetting(engine: ReturnType<typeof createGhostEngine>, cycleId: number, toSecond: number) {
  for (let sec = 0; sec <= toSecond; sec++) {
    engine.tick({ name: 'betting', cycleSecond: sec, cycleId }, null);
  }
}

function betSnapshot(bets: Array<{ vipId: string; type: string; value?: number; amount: number }>) {
  return bets.map((b) => ({
    vipId: b.vipId,
    type: b.type,
    value: b.value,
    amount: b.amount,
  }));
}

describe('ghostPlayers', () => {
  it('exports five frozen VIP lounge profiles', () => {
    expect(GHOST_VIPS).toHaveLength(5);
    expect(GHOST_VIPS[0]).toEqual({ id: 'aurora', name: 'Aurora', hue: 42 });
    expect(GHOST_VIPS.map((v) => v.id)).toEqual(['aurora', 'stacks', 'neon', 'baron', 'velvet']);
  });

  describe('createGhostEngine', () => {
    it('exposes tick, ghostAmount, and resetForCycle', () => {
      const engine = createGhostEngine();
      expect(typeof engine.tick).toBe('function');
      expect(typeof engine.ghostAmount).toBe('function');
      expect(typeof engine.resetForCycle).toBe('function');
    });

    it('is deterministic for the same cycleId and clock', () => {
      const left = createGhostEngine();
      const right = createGhostEngine();
      const clock = { name: 'betting' as const, cycleSecond: 15, cycleId: CYCLE_42 };

      advanceBetting(left, CYCLE_42, 14);
      advanceBetting(right, CYCLE_42, 14);

      const a = left.tick(clock, null);
      const b = right.tick(clock, null);
      expect(betSnapshot(a.bets)).toEqual(betSnapshot(b.bets));
    });

    it('produces different schedules per cycleId', () => {
      const a = createGhostEngine();
      const b = createGhostEngine();
      advanceBetting(a, 100, 19);
      advanceBetting(b, 200, 19);
      const ra = a.tick({ name: 'betting', cycleSecond: 19, cycleId: 100 }, null);
      const rb = b.tick({ name: 'betting', cycleSecond: 19, cycleId: 200 }, null);
      expect(betSnapshot(ra.bets)).not.toEqual(betSnapshot(rb.bets));
    });

    it('places scheduled VIP bets as the betting window advances', () => {
      const engine = createGhostEngine();
      const early = engine.tick({ name: 'betting', cycleSecond: 0, cycleId: CYCLE_42 }, null);
      advanceBetting(engine, CYCLE_42, 19);
      const late = engine.tick({ name: 'betting', cycleSecond: 19, cycleId: CYCLE_42 }, null);

      expect(early.bets).toHaveLength(0);
      expect(late.bets.length).toBeGreaterThan(0);
      expect(late.bets.every((b) => GHOST_VIPS.some((v) => v.id === b.vipId))).toBe(true);
    });

    it('merges repeat wagers from the same VIP onto one target', () => {
      const engine = createGhostEngine();
      advanceBetting(engine, 17, 20);
      const { bets } = engine.tick({ name: 'betting', cycleSecond: 20, cycleId: 17 }, null);
      const merged = bets.find((b) => b.vipId === 'aurora' && b.type === 'straight' && b.value === 16);

      expect(merged).toBeDefined();
      expect(merged!.amount).toBe(26);
      expect(CHIP_VALUES).not.toContain(merged!.amount);
    });

    it('advances chip drop animation until landed', () => {
      const engine = createGhostEngine();
      advanceBetting(engine, CYCLE_42, 19);
      const first = engine.tick({ name: 'betting', cycleSecond: 19, cycleId: CYCLE_42 }, null);
      const animating = first.bets.find((b) => !b.landed);
      expect(animating).toBeDefined();

      for (let i = 0; i < 12; i++) {
        engine.tick({ name: 'betting', cycleSecond: 19, cycleId: CYCLE_42 }, null);
      }
      const settled = engine.tick({ name: 'betting', cycleSecond: 19, cycleId: CYCLE_42 }, null);
      const same = settled.bets.find((b) => b.id === animating!.id);

      expect(same!.dropT).toBe(1);
      expect(same!.landed).toBe(true);
    });

    it('aggregates ghostAmount by board cell', () => {
      const engine = createGhostEngine();
      advanceBetting(engine, CYCLE_42, 19);
      engine.tick({ name: 'betting', cycleSecond: 19, cycleId: CYCLE_42 }, null);

      expect(engine.ghostAmount('dozen', 3)).toBe(25);
      expect(engine.ghostAmount('straight', 33)).toBe(5);
      expect(engine.ghostAmount('red', undefined)).toBe(0);
    });

    it('emits confetti for winning ghost bets at spin settle', () => {
      const engine = createGhostEngine();
      advanceBetting(engine, CYCLE_42, 19);
      engine.tick({ name: 'betting', cycleSecond: 19, cycleId: CYCLE_42 }, null);
      const spin = engine.tick({ name: 'spinning', cycleSecond: 29, cycleId: CYCLE_42 }, 33);

      expect(spin.confetti.length).toBeGreaterThan(0);
      expect(spin.confetti).toContainEqual(
        expect.objectContaining({ type: 'straight', value: 33, hue: 45 }),
      );
    });

    it('clears confetti when a new betting window opens', () => {
      const engine = createGhostEngine();
      advanceBetting(engine, CYCLE_42, 19);
      engine.tick({ name: 'spinning', cycleSecond: 29, cycleId: CYCLE_42 }, 33);
      const cleared = engine.tick({ name: 'betting', cycleSecond: 0, cycleId: CYCLE_42 }, null);

      expect(cleared.confetti).toEqual([]);
    });

    it('resetForCycle re-seeds state for manual cycle jumps', () => {
      const engine = createGhostEngine();
      advanceBetting(engine, CYCLE_42, 19);
      engine.resetForCycle(99);
      const fresh = engine.tick({ name: 'betting', cycleSecond: 0, cycleId: 99 }, null);

      expect(fresh.bets).toEqual([]);
      expect(fresh.confetti).toEqual([]);
    });
  });
});
