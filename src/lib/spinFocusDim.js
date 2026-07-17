export const SPIN_SOFT_OPACITY = 0.72;
export const SPIN_SOFT_SCALE = 0.98;

/** True during live ball-drop / spin HUD phase. */
export function shouldDimBettingPanel(hudPhase) {
  return hudPhase === 'spin-focus';
}

/** Panel dim intensity: none → soft (locked) → deep (live spin). */
export function spinFocusDimLevel(hudPhase, clockName = 'betting') {
  if (hudPhase === 'spin-focus') return 'deep';
  if (hudPhase === 'locked' || clockName === 'locked') return 'soft';
  return 'none';
}

/** CSS custom properties wired from APP_CONFIG.hud spin-focus tuning. */
export function spinFocusCssVars({ spinFocusOpacity = 0.15, spinFocusScale = 0.95 } = {}) {
  return {
    '--spin-focus-opacity': String(spinFocusOpacity),
    '--spin-focus-scale': String(spinFocusScale),
    '--spin-soft-opacity': String(SPIN_SOFT_OPACITY),
    '--spin-soft-scale': String(SPIN_SOFT_SCALE),
  };
}
