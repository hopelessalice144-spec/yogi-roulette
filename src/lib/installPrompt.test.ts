import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const DISMISS_KEY = 'turboRoulette.installDismissed';

function mockLocalStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  });
  return store;
}

async function loadInstallModule() {
  return import('./installPrompt.js');
}

describe('installPrompt', () => {
  const eventListeners = new Map<string, Set<(event: unknown) => void>>();

  function setupWindow(standalone = false, iosStandalone = false) {
    eventListeners.clear();
    vi.stubGlobal('window', {
      addEventListener: (type: string, fn: (event: unknown) => void) => {
        if (!eventListeners.has(type)) eventListeners.set(type, new Set());
        eventListeners.get(type)!.add(fn);
      },
      matchMedia: vi.fn().mockImplementation((query: string) => ({
        matches: standalone && query.includes('standalone'),
      })),
      navigator: { standalone: iosStandalone },
    });
  }

  function dispatch(type: string, event: unknown) {
    for (const fn of eventListeners.get(type) ?? []) fn(event);
  }

  function makeDeferredPrompt(outcome: 'accepted' | 'dismissed' = 'accepted') {
    const prompt = vi.fn().mockResolvedValue(undefined);
    return {
      preventDefault: vi.fn(),
      prompt,
      userChoice: Promise.resolve({ outcome }),
    };
  }

  beforeEach(() => {
    vi.resetModules();
    mockLocalStorage();
    setupWindow();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  describe('isStandaloneDisplay', () => {
    it('returns false when window is unavailable', async () => {
      vi.stubGlobal('window', undefined);
      const { isStandaloneDisplay } = await loadInstallModule();
      expect(isStandaloneDisplay()).toBe(false);
    });

    it('detects CSS display-mode standalone', async () => {
      setupWindow(true);
      const { isStandaloneDisplay } = await loadInstallModule();
      expect(isStandaloneDisplay()).toBe(true);
    });

    it('detects iOS navigator.standalone', async () => {
      setupWindow(false, true);
      const { isStandaloneDisplay } = await loadInstallModule();
      expect(isStandaloneDisplay()).toBe(true);
    });
  });

  describe('getInstallPromptBridge', () => {
    it('returns a stable singleton bridge', async () => {
      const { getInstallPromptBridge } = await loadInstallModule();
      expect(getInstallPromptBridge()).toBe(getInstallPromptBridge());
    });

    it('starts unable to prompt until beforeinstallprompt fires', async () => {
      const { getInstallPromptBridge } = await loadInstallModule();
      const bridge = getInstallPromptBridge();
      expect(bridge.canPrompt()).toBe(false);
      await expect(bridge.prompt()).resolves.toEqual({ outcome: 'unavailable' });
    });

    it('captures beforeinstallprompt and enables custom prompt UI', async () => {
      const { getInstallPromptBridge } = await loadInstallModule();
      const bridge = getInstallPromptBridge();
      const deferred = makeDeferredPrompt('accepted');
      dispatch('beforeinstallprompt', deferred);

      expect(deferred.preventDefault).toHaveBeenCalled();
      expect(bridge.canPrompt()).toBe(true);
    });

    it('notifies subscribers when install becomes available', async () => {
      const { getInstallPromptBridge } = await loadInstallModule();
      const bridge = getInstallPromptBridge();
      const fn = vi.fn();
      const unsub = bridge.subscribe(fn);

      dispatch('beforeinstallprompt', makeDeferredPrompt());
      expect(fn).toHaveBeenCalledWith(true);

      unsub();
      dispatch('appinstalled', {});
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('syncs subscriber immediately when prompt already deferred', async () => {
      const { getInstallPromptBridge } = await loadInstallModule();
      const bridge = getInstallPromptBridge();
      dispatch('beforeinstallprompt', makeDeferredPrompt());

      const fn = vi.fn();
      bridge.subscribe(fn);
      expect(fn).toHaveBeenCalledWith(true);
    });

    it('resolves accepted prompt outcomes and clears deferred event', async () => {
      const { getInstallPromptBridge } = await loadInstallModule();
      const bridge = getInstallPromptBridge();
      const deferred = makeDeferredPrompt('accepted');
      dispatch('beforeinstallprompt', deferred);

      await expect(bridge.prompt()).resolves.toEqual({ outcome: 'accepted' });
      expect(deferred.prompt).toHaveBeenCalled();
      expect(bridge.canPrompt()).toBe(false);
    });

    it('maps dismissed user choice', async () => {
      const { getInstallPromptBridge } = await loadInstallModule();
      const bridge = getInstallPromptBridge();
      dispatch('beforeinstallprompt', makeDeferredPrompt('dismissed'));

      await expect(bridge.prompt()).resolves.toEqual({ outcome: 'dismissed' });
    });

    it('respects dismiss persistence in localStorage', async () => {
      const store = mockLocalStorage();
      store.set(DISMISS_KEY, '1');
      const { getInstallPromptBridge } = await loadInstallModule();
      const bridge = getInstallPromptBridge();
      dispatch('beforeinstallprompt', makeDeferredPrompt());

      expect(bridge.wasDismissed()).toBe(true);
      expect(bridge.canPrompt()).toBe(false);
    });

    it('blocks prompts in standalone display mode', async () => {
      setupWindow(true);
      const { getInstallPromptBridge } = await loadInstallModule();
      const bridge = getInstallPromptBridge();
      dispatch('beforeinstallprompt', makeDeferredPrompt());

      expect(bridge.canPrompt()).toBe(false);
    });

    it('clears deferred prompt after appinstalled', async () => {
      const { getInstallPromptBridge } = await loadInstallModule();
      const bridge = getInstallPromptBridge();
      const onChange = vi.fn();
      bridge.subscribe(onChange);
      dispatch('beforeinstallprompt', makeDeferredPrompt());
      dispatch('appinstalled', {});

      expect(bridge.canPrompt()).toBe(false);
      expect(onChange).toHaveBeenLastCalledWith(false);
    });

    it('markDismissed writes localStorage flag', async () => {
      const store = mockLocalStorage();
      const { getInstallPromptBridge } = await loadInstallModule();
      const bridge = getInstallPromptBridge();
      bridge.markDismissed();
      expect(store.get(DISMISS_KEY)).toBe('1');
    });
  });
});
