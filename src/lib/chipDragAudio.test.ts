import { describe, expect, it } from 'vitest';
import {
  chipDragWhooshIntensity,
  chipLandPitch,
  chipTimbreForTheme,
} from './chipDragAudio.js';
import { UI_THEME_LIGHT, UI_THEME_NEON } from './uiTheme.js';

describe('chipDragAudio', () => {
  it('selects timbre by UI theme', () => {
    expect(chipTimbreForTheme(UI_THEME_NEON).id).toBe('neon');
    expect(chipTimbreForTheme(UI_THEME_LIGHT).id).toBe('light');
    expect(chipTimbreForTheme('lounge').id).toBe('lounge');
  });

  it('lowers land pitch for heavier chips', () => {
    const profile = chipTimbreForTheme('lounge');
    const small = chipLandPitch(5, profile);
    const large = chipLandPitch(500, profile);
    expect(large.high).toBeLessThan(small.high);
  });

  it('maps drag speed to whoosh intensity', () => {
    expect(chipDragWhooshIntensity(0)).toBeGreaterThanOrEqual(0.15);
    expect(chipDragWhooshIntensity(2)).toBeLessThanOrEqual(1.35);
  });
});
