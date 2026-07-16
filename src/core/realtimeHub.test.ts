import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRealtimeHub } from './realtimeHub.js';
import { SYNC_MODES } from './rtProtocol.js';

const API_BASE = 'http://authority.test';

type MockSource = {
  url: string;
  onopen: (() => void) | null;
  onmessage: ((event: MessageEvent<string>) => void) | null;
  onerror: (() => void) | null;
  closed: boolean;
};

const hubState = vi.hoisted(() => ({
  sources: [] as MockSource[],
}));

class MockEventSource {
  url: string;
  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent<string>) => void) | null = null;
  onerror: (() => void) | null = null;
  closed = false;

  constructor(url: string) {
    this.url = url;
    hubState.sources.push(this);
  }

  close(): void {
    this.closed = true;
  }
}

function latestSource(): MockSource {
  const source = hubState.sources.at(-1);
  if (!source) throw new Error('no EventSource created');
  return source;
}

describe('realtimeHub', () => {
  beforeEach(() => {
    hubState.sources.length = 0;
    vi.stubGlobal('EventSource', MockEventSource);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('uses wall-clock when API base is unset', () => {
    vi.stubEnv('VITE_API_BASE', '');
    const onModeChange = vi.fn();
    const hub = createRealtimeHub({ onTick: vi.fn(), onModeChange });

    expect(hub.mode).toBe(SYNC_MODES.WALL_CLOCK);
    expect(onModeChange).toHaveBeenCalledWith(SYNC_MODES.WALL_CLOCK);
    expect(hubState.sources).toHaveLength(0);
    hub.close();
  });

  it('opens SSE stream when API base is configured', () => {
    vi.stubEnv('VITE_API_BASE', API_BASE);
    const hub = createRealtimeHub({ onTick: vi.fn() });

    expect(hubState.sources).toHaveLength(1);
    expect(latestSource().url).toBe(`${API_BASE}/api/v1/cycle/stream`);
    hub.close();
    expect(latestSource().closed).toBe(true);
  });

  it('switches to authoritative-stream on open', () => {
    vi.stubEnv('VITE_API_BASE', API_BASE);
    const onModeChange = vi.fn();
    createRealtimeHub({ onTick: vi.fn(), onModeChange });

    latestSource().onopen?.();
    expect(onModeChange).toHaveBeenCalledWith(SYNC_MODES.AUTHORITATIVE_STREAM);
  });

  it('parses SSE tick messages', () => {
    vi.stubEnv('VITE_API_BASE', API_BASE);
    const onTick = vi.fn();
    createRealtimeHub({ onTick });

    latestSource().onmessage?.({
      data: JSON.stringify({
        cycleId: 99,
        cycleSecond: 12,
        name: 'betting',
        secondsRemaining: 18,
        nowMs: 1_000,
      }),
    } as MessageEvent<string>);

    expect(onTick).toHaveBeenCalledWith(
      expect.objectContaining({ cycleId: 99, cycleSecond: 12, name: 'betting' })
    );
  });

  it('ignores malformed SSE payloads', () => {
    vi.stubEnv('VITE_API_BASE', API_BASE);
    const onTick = vi.fn();
    createRealtimeHub({ onTick });

    latestSource().onmessage?.({ data: 'not-json' } as MessageEvent<string>);
    latestSource().onmessage?.({
      data: JSON.stringify({ cycleId: 'bad', cycleSecond: 5 }),
    } as MessageEvent<string>);

    expect(onTick).not.toHaveBeenCalled();
  });

  it('falls back to wall-clock on stream error', () => {
    vi.stubEnv('VITE_API_BASE', API_BASE);
    const onModeChange = vi.fn();
    createRealtimeHub({ onTick: vi.fn(), onModeChange });

    latestSource().onopen?.();
    onModeChange.mockClear();
    latestSource().onerror?.();

    expect(onModeChange).toHaveBeenCalledWith(SYNC_MODES.WALL_CLOCK);
  });
});
