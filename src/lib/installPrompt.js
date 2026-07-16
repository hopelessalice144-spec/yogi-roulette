/**
 * PWA install prompt bridge — captures beforeinstallprompt for custom UI.
 */

const DISMISS_KEY = 'turboRoulette.installDismissed';

/** @typedef {{ outcome: 'accepted' | 'dismissed' | 'unavailable' }} PromptResult */

function readDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

function writeDismissed() {
  try {
    localStorage.setItem(DISMISS_KEY, '1');
  } catch {
    /* private mode */
  }
}

/** @returns {boolean} */
export function isStandaloneDisplay() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
  /** @type {{ standalone?: boolean }} */ (window.navigator).standalone === true
  );
}

function createInstallBridge() {
  /** @type {BeforeInstallPromptEvent | null} */
  let deferredPrompt = null;
  /** @type {Set<(canInstall: boolean) => void>} */
  const listeners = new Set();

  const notify = (canInstall) => {
    for (const fn of listeners) fn(canInstall);
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      deferredPrompt = /** @type {BeforeInstallPromptEvent} */ (event);
      notify(true);
    });

    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      notify(false);
    });
  }

  return {
    /** @param {(canInstall: boolean) => void} fn */
    subscribe(fn) {
      if (deferredPrompt && !readDismissed() && !isStandaloneDisplay()) {
        fn(true);
      }
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    /** @returns {Promise<PromptResult>} */
    async prompt() {
      if (!deferredPrompt) return { outcome: 'unavailable' };
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      notify(false);
      return { outcome: outcome === 'accepted' ? 'accepted' : 'dismissed' };
    },

    canPrompt() {
      return deferredPrompt != null && !readDismissed() && !isStandaloneDisplay();
    },

    wasDismissed: readDismissed,
    markDismissed: writeDismissed,
    isInstalled: isStandaloneDisplay,
  };
}

/** @type {ReturnType<typeof createInstallBridge> | null} */
let bridge = null;

export function getInstallPromptBridge() {
  if (!bridge) bridge = createInstallBridge();
  return bridge;
}

console.assert(typeof getInstallPromptBridge === 'function', 'install prompt bridge export');
