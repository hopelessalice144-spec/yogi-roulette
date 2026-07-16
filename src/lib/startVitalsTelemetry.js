/**
 * Boot Web Vitals collection (production only).
 */

import { initVitalsObservers } from '../core/vitalsTelemetry.js';

export function startVitalsTelemetry() {
  if (!import.meta.env.PROD) return;
  if (typeof window === 'undefined') return;
  initVitalsObservers();
}

console.assert(typeof startVitalsTelemetry === 'function', 'startVitalsTelemetry export');
