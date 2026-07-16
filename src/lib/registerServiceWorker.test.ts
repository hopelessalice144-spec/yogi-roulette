import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('registerServiceWorker', () => {
  const register = vi.fn();
  let loadHandler: (() => void) | null = null;

  function setProd(value: boolean) {
    (import.meta.env as { PROD: boolean }).PROD = value;
  }

  function setupBrowser({
    readyState = 'complete',
    hasServiceWorker = true,
  }: {
    readyState?: DocumentReadyState | 'interactive';
    hasServiceWorker?: boolean;
  } = {}) {
    loadHandler = null;
    vi.stubGlobal('navigator', hasServiceWorker ? { serviceWorker: { register } } : {});
    vi.stubGlobal('window', {
      addEventListener: vi.fn((type: string, fn: () => void) => {
        if (type === 'load') loadHandler = fn;
      }),
    });
    vi.stubGlobal('document', { readyState });
  }

  beforeEach(() => {
    register.mockReset();
    register.mockResolvedValue(undefined);
    setProd(false);
    setupBrowser();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    setProd(false);
  });

  it('exports registerPhysicsCacheWorker', async () => {
    const { registerPhysicsCacheWorker } = await import('./registerServiceWorker.js');
    expect(typeof registerPhysicsCacheWorker).toBe('function');
  });

  it('no-ops outside production builds', async () => {
    const { registerPhysicsCacheWorker } = await import('./registerServiceWorker.js');
    setProd(false);
    registerPhysicsCacheWorker();
    expect(register).not.toHaveBeenCalled();
  });

  it('no-ops when window is unavailable', async () => {
    vi.stubGlobal('window', undefined);
    const { registerPhysicsCacheWorker } = await import('./registerServiceWorker.js');
    setProd(true);
    registerPhysicsCacheWorker();
    expect(register).not.toHaveBeenCalled();
  });

  it('no-ops when serviceWorker is unsupported', async () => {
    setupBrowser({ hasServiceWorker: false });
    const { registerPhysicsCacheWorker } = await import('./registerServiceWorker.js');
    setProd(true);
    registerPhysicsCacheWorker();
    expect(register).not.toHaveBeenCalled();
  });

  it('registers /sw.js immediately when document is complete', async () => {
    setupBrowser({ readyState: 'complete' });
    const { registerPhysicsCacheWorker } = await import('./registerServiceWorker.js');
    setProd(true);
    registerPhysicsCacheWorker();

    expect(register).toHaveBeenCalledWith('/sw.js', { scope: '/' });
    expect(loadHandler).toBeNull();
  });

  it('defers registration until window load when document is not complete', async () => {
    setupBrowser({ readyState: 'interactive' });
    const { registerPhysicsCacheWorker } = await import('./registerServiceWorker.js');
    setProd(true);
    registerPhysicsCacheWorker();

    expect(register).not.toHaveBeenCalled();
    expect(loadHandler).toBeTypeOf('function');
    loadHandler?.();
    expect(register).toHaveBeenCalledWith('/sw.js', { scope: '/' });
  });

  it('swallows service worker registration failures', async () => {
    setupBrowser({ readyState: 'complete' });
    register.mockRejectedValue(new Error('blocked'));
    const { registerPhysicsCacheWorker } = await import('./registerServiceWorker.js');
    setProd(true);

    expect(() => registerPhysicsCacheWorker()).not.toThrow();
    await Promise.resolve();
    expect(register).toHaveBeenCalled();
  });
});
