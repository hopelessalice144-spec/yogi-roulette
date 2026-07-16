import { describe, expect, it } from 'vitest';
import {
  getRapierModulePromise,
  getRapierStagePromise,
  resetRapierCache,
  setRapierModulePromise,
  setRapierStagePromise,
} from './rapierCache.js';

describe('rapierCache', () => {
  it('stores and clears lazy-load promise slots', () => {
    const wasm = Promise.resolve({ Physics: 'Physics' });
    const stage = Promise.resolve({ RapierStage: 'RapierStage' });
    setRapierModulePromise(wasm);
    setRapierStagePromise(stage);
    expect(getRapierModulePromise()).toBe(wasm);
    expect(getRapierStagePromise()).toBe(stage);
    resetRapierCache();
    expect(getRapierModulePromise()).toBeNull();
    expect(getRapierStagePromise()).toBeNull();
  });
});
