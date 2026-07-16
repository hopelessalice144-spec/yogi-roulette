import { afterEach, describe, expect, it, vi } from 'vitest';
import { recordVital, resetProfileSnapshot } from './profileHarness.js';
import {
  flushVitalsBeacon,
  getTelemetryEndpoint,
  initVitalsObservers,
  isTelemetryEnabled,
} from './vitalsTelemetry.js';

describe('vitalsTelemetry', () => {
  afterEach(() => {
    resetProfileSnapshot();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  describe('getTelemetryEndpoint / isTelemetryEnabled', () => {
    it('returns null when VITE_TELEMETRY_URL is unset', () => {
      expect(getTelemetryEndpoint()).toBeNull();
      expect(isTelemetryEnabled()).toBe(false);
    });

    it('returns null for blank endpoint strings', () => {
      vi.stubEnv('VITE_TELEMETRY_URL', '   ');
      expect(getTelemetryEndpoint()).toBeNull();
      expect(isTelemetryEnabled()).toBe(false);
    });

    it('enables telemetry when endpoint is configured', () => {
      vi.stubEnv('VITE_TELEMETRY_URL', ' https://metrics.example/vitals ');
      expect(getTelemetryEndpoint()).toBe('https://metrics.example/vitals');
      expect(isTelemetryEnabled()).toBe(true);
    });
  });

  describe('flushVitalsBeacon', () => {
    it('skips when telemetry is disabled', () => {
      expect(flushVitalsBeacon('test')).toBe(false);
    });

    it('posts vitals snapshot via navigator.sendBeacon when enabled', async () => {
      vi.stubEnv('VITE_TELEMETRY_URL', 'https://metrics.example/vitals');
      recordVital('LCP', 1200, { rating: 'good' });

      const sendBeacon = vi.fn().mockReturnValue(true);
      vi.stubGlobal('navigator', { sendBeacon });
      vi.stubGlobal('window', { matchMedia: () => ({ matches: false }) });

      expect(flushVitalsBeacon('manual')).toBe(true);
      expect(sendBeacon).toHaveBeenCalledOnce();
      expect(sendBeacon.mock.calls[0]?.[0]).toBe('https://metrics.example/vitals');

      const blob = sendBeacon.mock.calls[0]?.[1] as Blob;
      const payload = JSON.parse(await blob.text());
      expect(payload.type).toBe('turbo-roulette.vitals');
      expect(payload.reason).toBe('manual');
      expect(payload.vitals.LCP.value).toBe(1200);
      expect(payload.profile).toBeDefined();
      expect(payload.meta.displayMode).toBe('browser');
    });

    it('falls back to fetch when sendBeacon is unavailable', () => {
      vi.stubEnv('VITE_TELEMETRY_URL', 'https://metrics.example/vitals');
      const fetchMock = vi.fn().mockResolvedValue(new Response());
      vi.stubGlobal('navigator', {});
      vi.stubGlobal('fetch', fetchMock);
      vi.stubGlobal('window', { matchMedia: () => ({ matches: false }) });

      expect(flushVitalsBeacon('fallback')).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://metrics.example/vitals',
        expect.objectContaining({
          method: 'POST',
          keepalive: true,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });
  });

  describe('initVitalsObservers', () => {
    it('no-ops when window is undefined', () => {
      expect(() => initVitalsObservers()).not.toThrow();
    });

    it('attaches lifecycle hooks when telemetry is enabled', () => {
      vi.stubEnv('VITE_TELEMETRY_URL', 'https://metrics.example/vitals');
      const addEventListener = vi.fn();
      vi.stubGlobal('window', { addEventListener });
      vi.stubGlobal('document', { addEventListener, visibilityState: 'visible' });
      vi.stubGlobal('performance', { getEntriesByType: () => [] });
      vi.stubGlobal('PerformanceObserver', undefined);

      expect(() => initVitalsObservers()).not.toThrow();
      expect(addEventListener).toHaveBeenCalled();
    });
  });
});
