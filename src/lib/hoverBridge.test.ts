import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHoverBridge } from './hoverBridge.js';

describe('hoverBridge', () => {
  let rafCallback: FrameRequestCallback | null;
  let highlightRef: { current: unknown };
  let setState: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    rafCallback = null;
    highlightRef = { current: undefined };
    setState = vi.fn();
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafCallback = cb;
      return 1;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function flushFrame(time = 0): void {
    rafCallback?.(time);
    rafCallback = null;
  }

  it('push writes the ref immediately and defers React state to rAF', () => {
    const bridge = createHoverBridge(highlightRef, setState);
    const hover = { type: 'straight', value: 7 };

    bridge.push(hover);
    expect(highlightRef.current).toBe(hover);
    expect(setState).not.toHaveBeenCalled();

    flushFrame();
    expect(setState).toHaveBeenCalledOnce();
    expect(setState).toHaveBeenCalledWith(hover);
  });

  it('coalesces multiple pushes into one frame flush', () => {
    const bridge = createHoverBridge(highlightRef, setState);
    bridge.push({ type: 'red', value: undefined });
    bridge.push({ type: 'straight', value: 12 });

    expect(rafCallback).not.toBeNull();
    flushFrame();
    expect(setState).toHaveBeenCalledOnce();
    expect(setState).toHaveBeenCalledWith({ type: 'straight', value: 12 });
    expect(highlightRef.current).toEqual({ type: 'straight', value: 12 });
  });

  it('clear nulls the ref immediately and clears React state on flush', () => {
    const bridge = createHoverBridge(highlightRef, setState);
    bridge.push({ type: 'odd', value: undefined });
    bridge.clear();

    expect(highlightRef.current).toBeNull();
    expect(setState).not.toHaveBeenCalled();

    flushFrame();
    expect(setState).toHaveBeenCalledWith(null);
  });

  it('clear wins over a pending push in the same frame', () => {
    const bridge = createHoverBridge(highlightRef, setState);
    bridge.push({ type: 'low', value: undefined });
    bridge.clear();
    flushFrame();
    expect(setState).toHaveBeenCalledWith(null);
  });

  it('pushImmediate updates ref and React state synchronously', () => {
    const bridge = createHoverBridge(highlightRef, setState);
    const hover = { type: 'column', value: 2 };

    bridge.pushImmediate(hover);
    expect(highlightRef.current).toBe(hover);
    expect(setState).toHaveBeenCalledOnce();
    expect(setState).toHaveBeenCalledWith(hover);
    expect(rafCallback).toBeNull();
  });
});
