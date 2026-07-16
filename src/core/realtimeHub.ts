/**
 * Server-Sent Events hub — authoritative cycle ticks with wall-clock fallback.
 */

import { getApiBase } from './authorityClient.js';
import { parseCycleTick, SYNC_MODES } from './rtProtocol.js';
import type { RealtimeHubHandle, RealtimeHubOptions, SyncMode } from './types.js';

export function createRealtimeHub({ onTick, onModeChange }: RealtimeHubOptions): RealtimeHubHandle {
  const base = getApiBase();
  if (!base) {
    onModeChange?.(SYNC_MODES.WALL_CLOCK);
    return { close: () => {}, mode: SYNC_MODES.WALL_CLOCK };
  }

  let es: EventSource | null = null;
  let mode: SyncMode = SYNC_MODES.WALL_CLOCK;

  const setMode = (next: SyncMode) => {
    if (mode === next) return;
    mode = next;
    onModeChange?.(next);
  };

  try {
    es = new EventSource(`${base}/api/v1/cycle/stream`);
    es.onopen = () => setMode(SYNC_MODES.AUTHORITATIVE_STREAM);
    es.onmessage = (event: MessageEvent<string>) => {
      try {
        const tick = parseCycleTick(JSON.parse(event.data));
        if (tick) onTick(tick);
      } catch {
        /* malformed tick */
      }
    };
    es.onerror = () => setMode(SYNC_MODES.WALL_CLOCK);
  } catch {
    setMode(SYNC_MODES.WALL_CLOCK);
  }

  return {
    mode,
    close: () => {
      es?.close();
      es = null;
    },
  };
}

console.assert(typeof createRealtimeHub === 'function', 'realtime hub export');
