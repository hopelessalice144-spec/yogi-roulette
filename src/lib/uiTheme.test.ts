import { describe, expect, it } from 'vitest';
import {
  cycleUiTheme,
  DEFAULT_UI_THEME,
  loadUiTheme,
  normalizeUiTheme,
  themeColor,
  themeLabel,
  themeSubtitle,
  UI_THEME_LIGHT,
  UI_THEME_LOUNGE,
  UI_THEME_NEON,
  UI_THEMES,
} from './uiTheme.js';

describe('uiTheme', () => {
  it('normalizes theme ids', () => {
    expect(normalizeUiTheme('neon')).toBe(UI_THEME_NEON);
    expect(normalizeUiTheme('light')).toBe(UI_THEME_LIGHT);
    expect(normalizeUiTheme('invalid')).toBe(DEFAULT_UI_THEME);
  });

  it('cycles lounge → neon → daylight → lounge', () => {
    expect(cycleUiTheme(UI_THEME_LOUNGE)).toBe(UI_THEME_NEON);
    expect(cycleUiTheme(UI_THEME_NEON)).toBe(UI_THEME_LIGHT);
    expect(cycleUiTheme(UI_THEME_LIGHT)).toBe(UI_THEME_LOUNGE);
    expect(UI_THEMES).toHaveLength(3);
  });

  it('labels themes for HUD copy', () => {
    expect(themeLabel(UI_THEME_NEON)).toBe('Neon');
    expect(themeLabel(UI_THEME_LIGHT)).toBe('Daylight');
    expect(themeLabel(UI_THEME_LOUNGE)).toBe('Lounge');
    expect(themeSubtitle(UI_THEME_LIGHT)).toContain('Daylight');
    expect(loadUiTheme()).toBeTruthy();
  });

  it('maps theme profiles to browser theme-color', () => {
    expect(themeColor(UI_THEME_LOUNGE)).toBe('#0a0814');
    expect(themeColor(UI_THEME_NEON)).toBe('#06040f');
    expect(themeColor(UI_THEME_LIGHT)).toBe('#e8eef5');
  });
});
