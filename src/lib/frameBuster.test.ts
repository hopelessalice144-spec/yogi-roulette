import { afterEach, describe, expect, it, vi } from 'vitest';
import { enforceTopLevelFrame } from './frameBuster.js';

describe('frameBuster', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('no-ops when window is unavailable', () => {
    vi.stubGlobal('window', undefined);
    expect(() => enforceTopLevelFrame()).not.toThrow();
  });

  it('does nothing on top-level frames', () => {
    const location = { href: 'https://turbo.test/' };
    const frame = { location };
    vi.stubGlobal('window', { self: frame, top: frame });
    enforceTopLevelFrame();
    expect(location.href).toBe('https://turbo.test/');
  });

  it('breaks out of hostile iframes by syncing top location', () => {
    const selfLocation = { href: 'https://turbo.test/play' };
    let syncedLocation: typeof selfLocation | undefined;
    const topFrame: { location?: typeof selfLocation } = {};
    Object.defineProperty(topFrame, 'location', {
      configurable: true,
      enumerable: true,
      get() {
        return syncedLocation ?? { href: 'https://evil.test/frame' };
      },
      set(value: typeof selfLocation) {
        syncedLocation = value;
      },
    });
    vi.stubGlobal('window', {
      self: { location: selfLocation },
      top: topFrame,
    });
    enforceTopLevelFrame();
    expect(syncedLocation).toBe(selfLocation);
  });

  it('blocks UI when cross-origin parent prevents breakout', () => {
    const add = vi.fn();
    vi.stubGlobal('window', {
      self: { location: { href: 'https://turbo.test/' } },
      get top() {
        throw new Error('cross-origin');
      },
    });
    vi.stubGlobal('document', {
      documentElement: { classList: { add } },
    });
    enforceTopLevelFrame();
    expect(add).toHaveBeenCalledWith('frame-blocked');
  });
});
