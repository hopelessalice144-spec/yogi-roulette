/**
 * Web Vitals observers + optional telemetry beacon (VITE_TELEMETRY_URL).
 */

import { getVitalsSnapshot, recordVital } from './profileHarness.js';

const THRESHOLDS = Object.freeze({
  TTFB: [800, 1800],
  FCP: [1800, 3000],
  LCP: [2500, 4000],
  CLS: [0.1, 0.25],
  INP: [200, 500],
});

/** @param {keyof typeof THRESHOLDS} name @param {number} value */
function rateVital(name, value) {
  const [good, poor] = THRESHOLDS[name] ?? [0, 0];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

function readEnv(key) {
  try {
    return import.meta?.env?.[key];
  } catch {
    return undefined;
  }
}

export function getTelemetryEndpoint() {
  const url = readEnv('VITE_TELEMETRY_URL');
  if (typeof url !== 'string' || url.trim() === '') return null;
  return url.trim();
}

export function isTelemetryEnabled() {
  return getTelemetryEndpoint() != null;
}

/** @param {Record<string, unknown>} payload */
function sendBeacon(payload) {
  const endpoint = getTelemetryEndpoint();
  if (!endpoint) return false;
  const body = JSON.stringify(payload);
  try {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      return navigator.sendBeacon(endpoint, blob);
    }
    fetch(endpoint, {
      method: 'POST',
      body,
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {});
    return true;
  } catch {
    return false;
  }
}

/** Push profile + vitals snapshot to configured endpoint. */
export function flushVitalsBeacon(reason = 'manual') {
  if (!isTelemetryEnabled()) return false;
  const snapshot = getVitalsSnapshot();
  return sendBeacon({
    type: 'turbo-roulette.vitals',
    reason,
    ts: Date.now(),
    vitals: snapshot.vitals,
    profile: {
      rapierWasmMs: snapshot.rapierWasmMs,
      rapierStageMs: snapshot.rapierStageMs,
      marks: snapshot.marks,
    },
    meta: {
      displayMode:
        typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches
          ? 'standalone'
          : 'browser',
    },
  });
}

function observePaint() {
  if (typeof PerformanceObserver === 'undefined') return;
  try {
    const po = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          recordVital('FCP', entry.startTime, { rating: rateVital('FCP', entry.startTime) });
        }
      }
    });
    po.observe({ type: 'paint', buffered: true });
  } catch {
    /* unsupported */
  }
}

function observeLcp() {
  if (typeof PerformanceObserver === 'undefined') return;
  try {
    const po = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (!last) return;
      recordVital('LCP', last.startTime, { rating: rateVital('LCP', last.startTime) });
    });
    po.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {
    /* unsupported */
  }
}

function observeCls() {
  if (typeof PerformanceObserver === 'undefined') return;
  let cls = 0;
  try {
    const po = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.hadRecentInput) continue;
        cls += entry.value;
        recordVital('CLS', cls, { rating: rateVital('CLS', cls) });
      }
    });
    po.observe({ type: 'layout-shift', buffered: true });
  } catch {
    /* unsupported */
  }
}

function observeInp() {
  if (typeof PerformanceObserver === 'undefined') return;
  try {
    const po = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const duration = entry.duration ?? entry.processingEnd - entry.startTime;
        if (!Number.isFinite(duration)) continue;
        recordVital('INP', duration, { rating: rateVital('INP', duration) });
      }
    });
    po.observe({ type: 'event', buffered: true, durationThreshold: 16 });
  } catch {
    /* INP observer unavailable — try first-input fallback */
    try {
      const po = new PerformanceObserver((list) => {
        const entry = list.getEntries()[0];
        if (!entry) return;
        const delay = entry.processingStart - entry.startTime;
        recordVital('FID', delay, { rating: rateVital('INP', delay) });
      });
      po.observe({ type: 'first-input', buffered: true });
    } catch {
      /* unsupported */
    }
  }
}

function captureNavigationTiming() {
  if (typeof performance === 'undefined') return;
  const nav = performance.getEntriesByType('navigation')[0];
  if (!nav || nav.responseStart <= 0) return;
  const ttfb = nav.responseStart - nav.requestStart;
  recordVital('TTFB', ttfb, { rating: rateVital('TTFB', ttfb) });
}

/** Attach PerformanceObserver hooks for Core Web Vitals. */
export function initVitalsObservers() {
  if (typeof window === 'undefined') return;
  captureNavigationTiming();
  observePaint();
  observeLcp();
  observeCls();
  observeInp();

  if (isTelemetryEnabled()) {
    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.visibilityState === 'hidden') flushVitalsBeacon('visibility-hidden');
      },
      { passive: true }
    );
    window.addEventListener('pagehide', () => flushVitalsBeacon('pagehide'), { passive: true });
  }
}

console.assert(typeof initVitalsObservers === 'function', 'vitals observers export');
console.assert(typeof flushVitalsBeacon === 'function', 'vitals beacon export');
