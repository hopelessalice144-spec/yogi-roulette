import { describe, expect, it } from 'vitest';
import { PORTRAIT_MOBILE_MQ, usePortraitMobile } from './usePortraitMobile.js';

describe('usePortraitMobile', () => {
  it('exports portrait mobile media query constant', () => {
    expect(PORTRAIT_MOBILE_MQ).toContain('orientation: portrait');
    expect(typeof usePortraitMobile).toBe('function');
  });
});
