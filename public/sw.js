/**
 * Physics asset cache — stale-while-revalidate for Rapier WASM chunks.
 * Served from /sw.js (public/ → dist/).
 */

const PHYSICS_CACHE = 'turbo-roulette-physics-v1';
const LEGACY_PREFIX = 'turbo-roulette-physics-';

/** @param {string} pathname */
function isPhysicsAsset(pathname) {
  return (
    /\/assets\/rapier-[^/]+\.js$/i.test(pathname) ||
    /\/assets\/RapierStage-[^/]+\.js$/i.test(pathname) ||
    /\.wasm$/i.test(pathname)
  );
}

/** @param {Request} request */
function isPhysicsRequest(request) {
  if (request.method !== 'GET') return false;
  try {
    return isPhysicsAsset(new URL(request.url).pathname);
  } catch {
    return false;
  }
}

/** @param {Response} response */
function isCacheable(response) {
  return response && response.ok && response.type === 'basic';
}

/** @param {Cache} cache @param {Request} request */
async function revalidate(cache, request) {
  try {
    const fresh = await fetch(request);
    if (isCacheable(fresh)) {
      await cache.put(request, fresh.clone());
    }
  } catch {
    /* offline — keep stale */
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(LEGACY_PREFIX) && key !== PHYSICS_CACHE)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  if (!isPhysicsRequest(event.request)) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(PHYSICS_CACHE);
      const cached = await cache.match(event.request);

      if (cached) {
        event.waitUntil(revalidate(cache, event.request));
        return cached;
      }

      const response = await fetch(event.request);
      if (isCacheable(response)) {
        await cache.put(event.request, response.clone());
      }
      return response;
    })()
  );
});
