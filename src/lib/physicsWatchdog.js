/**
 * Ball physics watchdog — OOB recovery, settle force, stuck detection.
 */
import { WHEEL } from './wheel.js';
import { ORBIT_RADIUS, ORBIT_Y, TRACK_RADIUS, TRACK_Y } from './trajectory.js';

export const SETTLE_WATCHDOG_MS = 4000;

export const WATCHDOG_EVENT = Object.freeze({
  OOB_RECOVERY: 'oob',
  SETTLE_FORCE: 'settle',
  STUCK_RECOVERY: 'stuck',
});

export const BALL_BOUNDS = Object.freeze({
  maxRadius: WHEEL.outerRadius + 0.12,
  minY: 0.035,
  maxY: ORBIT_Y + 0.35,
  trackRadius: WHEEL.trackRadius,
  floorY: 0.04,
});

/** Mutable journal for silent recovery telemetry (dev / diagnostics). */
export function createWatchdogJournal() {
  return {
    oobRecoveries: 0,
    settleForces: 0,
    stuckRecoveries: 0,
    lastEvent: null,
    lastAt: 0,
  };
}

export function recordWatchdogEvent(journal, type) {
  if (!journal) return;
  journal.lastEvent = type;
  journal.lastAt = Date.now();
  if (type === WATCHDOG_EVENT.OOB_RECOVERY) journal.oobRecoveries += 1;
  else if (type === WATCHDOG_EVENT.SETTLE_FORCE) journal.settleForces += 1;
  else if (type === WATCHDOG_EVENT.STUCK_RECOVERY) journal.stuckRecoveries += 1;
}

/**
 * Silent OOB recovery — snap ball back to outer track.
 * @returns {object|null} recovery pose or null if in bounds
 */
export function recoverBallIfOOB(x, y, z, wheelAngle = 0, journal = null) {
  const r = Math.hypot(x, z);
  const oob =
    r > BALL_BOUNDS.maxRadius ||
    y < BALL_BOUNDS.minY ||
    y > BALL_BOUNDS.maxY ||
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(z);

  if (!oob) return null;

  recordWatchdogEvent(journal, WATCHDOG_EVENT.OOB_RECOVERY);

  const angle = Math.atan2(x, z) || wheelAngle;
  const snapR = Math.min(TRACK_RADIUS, ORBIT_RADIUS - 0.02);
  const snapY = y < BALL_BOUNDS.minY ? TRACK_Y : Math.max(TRACK_Y, Math.min(ORBIT_Y, y));

  return {
    x: Math.sin(angle) * snapR,
    y: snapY,
    z: Math.cos(angle) * snapR,
    vx: 0,
    vy: 0,
    vz: 0,
  };
}

/** True when free-phase ball has effectively stopped but not captured. */
export function isBallStuck(speed, phase, stuckMs, thresholdMs = 2800, speedThreshold = 0.025) {
  if (phase !== 'free' && phase !== 'guided') return false;
  return speed < speedThreshold && stuckMs >= thresholdMs;
}

/** Smooth watchdog lerp factor for forced pocket settle. */
export function watchdogLerpAlpha(elapsedMs, durationMs = 900) {
  const t = Math.min(1, elapsedMs / durationMs);
  return 1 - Math.exp(-t * 4.8);
}

console.assert(BALL_BOUNDS.maxRadius > WHEEL.trackRadius, 'bounds wider than track');
