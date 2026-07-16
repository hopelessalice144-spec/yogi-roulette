import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const recovery = vi.hoisted(() => ({
  configureWebGLRenderer: vi.fn(),
  attachWebGLContextRecovery: vi.fn(() => vi.fn()),
}));

const react = vi.hoisted(() => {
  const states: unknown[] = [];
  const setters: Array<ReturnType<typeof vi.fn>> = [];
  let stateCall = 0;
  const refs: Array<{ current: unknown }> = [];
  let refCall = 0;
  const effectCleanups: Array<(() => void) | null> = [];
  let effectCall = 0;

  return {
    reset() {
      states.length = 0;
      setters.length = 0;
      stateCall = 0;
      refs.length = 0;
      refCall = 0;
      effectCleanups.length = 0;
      effectCall = 0;
    },
    useState(init: unknown) {
      const idx = stateCall++;
      if (states[idx] === undefined) {
        states[idx] = typeof init === 'function' ? (init as () => unknown)() : init;
      }
      if (!setters[idx]) {
        setters[idx] = vi.fn((updater: unknown) => {
          if (typeof updater === 'function') {
            states[idx] = (updater as (prev: unknown) => unknown)(states[idx]);
          } else {
            states[idx] = updater;
          }
        });
      }
      return [states[idx], setters[idx]];
    },
    useRef(init: unknown) {
      const idx = refCall++;
      if (!refs[idx]) refs[idx] = { current: init };
      return refs[idx];
    },
    useEffect(cb: () => void | (() => void)) {
      const idx = effectCall++;
      effectCleanups[idx]?.();
      effectCleanups[idx] = cb() ?? null;
    },
    useCallback<T extends (...args: never[]) => unknown>(fn: T) {
      return fn;
    },
    runUnmountCleanup() {
      for (const cleanup of effectCleanups) cleanup?.();
      effectCleanups.length = 0;
    },
    getCanvasKey: () => states[0],
    getWebglStatus: () => states[1],
    getCleanupRef: () => refs[0],
    getOnRestoreRef: () => refs[1],
  };
});

vi.mock('../lib/webglContextRecovery.js', () => recovery);
vi.mock('react', () => ({
  useState: react.useState,
  useEffect: react.useEffect,
  useRef: react.useRef,
  useCallback: react.useCallback,
}));

import { useWebGLRecovery } from './useWebGLRecovery.js';

type RecoveryHandlers = {
  onLost?: () => void;
  onRestored?: () => void;
};

function mockGl() {
  return {
    domElement: { tagName: 'CANVAS' },
    shadowMap: {},
  };
}

describe('useWebGLRecovery', () => {
  let handlers: RecoveryHandlers;

  beforeEach(() => {
    react.reset();
    handlers = {};
    recovery.configureWebGLRenderer.mockReset();
    recovery.attachWebGLContextRecovery.mockImplementation((...args: unknown[]) => {
      handlers = args[1] as RecoveryHandlers;
      return vi.fn();
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns default canvas key, ok status, and attachToCanvas', () => {
    const hook = useWebGLRecovery();
    expect(hook.canvasKey).toBe(0);
    expect(hook.webglStatus).toBe('ok');
    expect(typeof hook.attachToCanvas).toBe('function');
  });

  it('configures the renderer and attaches recovery listeners', () => {
    const hook = useWebGLRecovery();
    const gl = mockGl();
    const settings = { shadows: false };
    hook.attachToCanvas(gl, settings);

    expect(recovery.configureWebGLRenderer).toHaveBeenCalledWith(gl, settings);
    expect(recovery.attachWebGLContextRecovery).toHaveBeenCalledWith(
      gl.domElement,
      expect.objectContaining({
        onLost: expect.any(Function),
        onRestored: expect.any(Function),
      }),
    );
  });

  it('marks status lost on context loss', () => {
    const hook = useWebGLRecovery();
    hook.attachToCanvas(mockGl());
    handlers.onLost?.();
    expect(react.getWebglStatus()).toBe('lost');
  });

  it('remounts canvas and invokes onRestore after context restore', () => {
    const onRestore = vi.fn();
    const hook = useWebGLRecovery({ onRestore });
    hook.attachToCanvas(mockGl());

    handlers.onRestored?.();

    expect(onRestore).toHaveBeenCalledTimes(1);
    expect(react.getCanvasKey()).toBe(1);
    expect(react.getWebglStatus()).toBe('ok');
  });

  it('replaces the previous recovery cleanup when re-attaching', () => {
    const hook = useWebGLRecovery();
    const firstCleanup = vi.fn();
    const secondCleanup = vi.fn();
    recovery.attachWebGLContextRecovery
      .mockReturnValueOnce(firstCleanup)
      .mockReturnValueOnce(secondCleanup);

    hook.attachToCanvas(mockGl());
    hook.attachToCanvas(mockGl());

    expect(firstCleanup).toHaveBeenCalledTimes(1);
    expect(react.getCleanupRef().current).toBe(secondCleanup);
  });

  it('runs stored cleanup on unmount', () => {
    const hook = useWebGLRecovery();
    const detach = vi.fn();
    recovery.attachWebGLContextRecovery.mockReturnValue(detach);
    hook.attachToCanvas(mockGl());
    react.runUnmountCleanup();
    expect(detach).toHaveBeenCalledTimes(1);
  });
});
