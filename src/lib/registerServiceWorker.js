/**
 * Register physics-cache service worker (production only).
 */

/** Register stale-while-revalidate cache for Rapier WASM chunks. */
export function registerPhysicsCacheWorker() {
  if (!import.meta.env.PROD) return;
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  const register = () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      /* optional — dev preview / private mode may block */
    });
  };

  if (document.readyState === 'complete') {
    register();
  } else {
    window.addEventListener('load', register, { once: true });
  }
}

console.assert(typeof registerPhysicsCacheWorker === 'function', 'registerPhysicsCacheWorker export');
