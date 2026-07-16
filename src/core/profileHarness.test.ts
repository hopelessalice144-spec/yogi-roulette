import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getVitalsSnapshot,
  markProfile,
  measureProfile,
  profileSnapshot,
  recordVital,
  resetProfileSnapshot,
} from './profileHarness.js';

describe('profileHarness', () => {
  let nowMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    resetProfileSnapshot();
    nowMock = vi.fn();
    vi.stubGlobal('performance', { now: nowMock });
  });

  afterEach(() => {
    resetProfileSnapshot();
    vi.unstubAllGlobals();
  });

  describe('markProfile', () => {
    it('records performance marks by name', () => {
      nowMock.mockReturnValue(100);
      markProfile('rapier-wasm-start');
      expect(profileSnapshot.marks['rapier-wasm-start']).toBe(100);
    });
  });

  describe('measureProfile', () => {
    it('computes rounded duration from a start mark', () => {
      nowMock.mockReturnValueOnce(100).mockReturnValueOnce(142.7);
      markProfile('start');
      expect(measureProfile('load', 'start')).toBe(43);
      expect(profileSnapshot.marks.load).toBe(43);
    });

    it('sets rapierWasmMs and rapierStageMs for named measures', () => {
      nowMock.mockReturnValueOnce(0).mockReturnValueOnce(120);
      markProfile('wasm');
      measureProfile('rapier-wasm-load', 'wasm');
      expect(profileSnapshot.rapierWasmMs).toBe(120);

      nowMock.mockReturnValueOnce(0).mockReturnValueOnce(80);
      markProfile('stage');
      measureProfile('rapier-stage-load', 'stage');
      expect(profileSnapshot.rapierStageMs).toBe(80);
    });

    it('returns null when the start mark is missing', () => {
      expect(measureProfile('missing', 'not-there')).toBeNull();
    });
  });

  describe('recordVital', () => {
    it('stores rounded vitals with extras', () => {
      recordVital('LCP', 1234.5678, { rating: 'good' });
      expect(profileSnapshot.vitals.LCP).toMatchObject({
        value: 1234.568,
        rating: 'good',
      });
      expect(profileSnapshot.vitals.LCP?.at).toBeTypeOf('number');
    });

    it('ignores non-finite values', () => {
      recordVital('CLS', Number.NaN);
      recordVital('INP', Number.POSITIVE_INFINITY);
      expect(profileSnapshot.vitals.CLS).toBeUndefined();
      expect(profileSnapshot.vitals.INP).toBeUndefined();
    });
  });

  describe('getVitalsSnapshot', () => {
    it('returns a shallow copy of profile state', () => {
      nowMock.mockReturnValue(50);
      recordVital('FCP', 900, { rating: 'good' });
      markProfile('boot');
      const snap = getVitalsSnapshot();
      expect(snap.vitals.FCP?.value).toBe(900);
      expect(snap.marks.boot).toBe(50);
      profileSnapshot.vitals.FCP = { value: 0, at: 0 };
      expect(snap.vitals.FCP?.value).toBe(900);
    });
  });

  describe('resetProfileSnapshot', () => {
    it('clears marks, vitals, and rapier timings', () => {
      nowMock.mockReturnValueOnce(10).mockReturnValueOnce(70);
      markProfile('boot');
      recordVital('TTFB', 200);
      measureProfile('rapier-wasm-load', 'boot');
      resetProfileSnapshot();
      expect(profileSnapshot.marks).toEqual({});
      expect(profileSnapshot.vitals).toEqual({});
      expect(profileSnapshot.rapierWasmMs).toBeNull();
      expect(profileSnapshot.rapierStageMs).toBeNull();
      expect(measureProfile('load', 'boot')).toBeNull();
    });
  });
});
