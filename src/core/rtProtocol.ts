/**
 * Real-time cycle sync protocol (SSE / future WebSocket).
 */

import type { CycleTick, CycleTickInput, PhaseName, RtEvent, SyncMode } from './types.js';

export const RT_EVENTS = Object.freeze({
  CYCLE_TICK: 'cycle.tick',
  ROUND_COMMIT: 'round.commit',
  ROUND_REVEAL: 'round.reveal',
} satisfies Record<string, RtEvent>);

export const SYNC_MODES = Object.freeze({
  WALL_CLOCK: 'wall-clock',
  AUTHORITATIVE_STREAM: 'authoritative-stream',
  AUTHORITATIVE_API: 'authoritative-api',
} satisfies Record<string, SyncMode>);

function parsePhaseName(raw: unknown): PhaseName {
  const name = String(raw ?? 'betting');
  if (name === 'betting' || name === 'locked' || name === 'spinning') return name;
  return 'betting';
}

export function parseCycleTick(raw: CycleTickInput | null | undefined): Readonly<CycleTick> | null {
  if (!raw || typeof raw !== 'object') return null;
  const cycleId = Math.floor(Number(raw.cycleId));
  const cycleSecond = Math.floor(Number(raw.cycleSecond));
  if (!Number.isFinite(cycleId) || !Number.isFinite(cycleSecond)) return null;
  return Object.freeze({
    type: (raw.type ?? RT_EVENTS.CYCLE_TICK) as RtEvent | string,
    nowMs: Number(raw.nowMs) || Date.now(),
    cycleId,
    cycleSecond,
    name: parsePhaseName(raw.name),
    secondsRemaining: Math.floor(Number(raw.secondsRemaining) || 0),
  });
}

console.assert(parseCycleTick({ cycleId: 1, cycleSecond: 5, name: 'betting' }) !== null, 'parse tick');
