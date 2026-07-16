import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const initVitalsObservers = vi.fn();

vi.mock('../core/vitalsTelemetry.js', () => ({
  initVitalsObservers,
}));

describe('startVitalsTelemetry', () => {
  function setProd(value: boolean) {
    (import.meta.env as { PROD: boolean }).PROD = value;
  }

  beforeEach(() => {
    initVitalsObservers.mockReset();
    setProd(false);
    vi.stubGlobal('window', {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    setProd(false);
  });

  it('exports startVitalsTelemetry', async () => {
    const { startVitalsTelemetry } = await import('./startVitalsTelemetry.js');
    expect(typeof startVitalsTelemetry).toBe('function');
  });

  it('no-ops outside production builds', async () => {
    const { startVitalsTelemetry } = await import('./startVitalsTelemetry.js');
    setProd(false);
    startVitalsTelemetry();
    expect(initVitalsObservers).not.toHaveBeenCalled();
  });

  it('no-ops when window is unavailable', async () => {
    vi.stubGlobal('window', undefined);
    const { startVitalsTelemetry } = await import('./startVitalsTelemetry.js');
    setProd(true);
    startVitalsTelemetry();
    expect(initVitalsObservers).not.toHaveBeenCalled();
  });

  it('initializes vitals observers in production with a browser window', async () => {
    const { startVitalsTelemetry } = await import('./startVitalsTelemetry.js');
    setProd(true);
    startVitalsTelemetry();
    expect(initVitalsObservers).toHaveBeenCalledTimes(1);
  });
});
