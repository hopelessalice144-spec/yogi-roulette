/**
 * Single source of truth — maps wall-clock to ball phase, camera, wheel speed.
 */
import {
  BALL_DROP_AT,
  BALL_PHYSICS_AT,
  BALL_MAGNET_AT,
  BALL_SETTLE_AT,
} from '@core/timer.js';

export const GAME_STATES = Object.freeze({
  betting: {
    ballPhase: 'orbit',
    cameraMode: 'lounge',
    wheelSpinSpeed: 0.42,
    timeScale: 1,
  },
  locked: {
    ballPhase: 'orbit',
    cameraMode: 'tension',
    wheelSpinSpeed: 1.5,
    timeScale: 1,
  },
});

/** Resolve spin-phase state (cycle seconds 25–29). */
export function resolveSpinState(cycleSecond) {
  if (cycleSecond < BALL_PHYSICS_AT) {
    const t = (cycleSecond - BALL_DROP_AT) / Math.max(0.001, BALL_PHYSICS_AT - BALL_DROP_AT);
    return {
      ballPhase: 'descent',
      cameraMode: t < 0.5 ? 'rim' : 'drop',
      wheelSpinSpeed: 2.8,
      timeScale: 0.88,
      spinProgress: Math.max(0, t),
      message: 'Ball descending into the bowl…',
    };
  }
  if (cycleSecond < BALL_MAGNET_AT) {
    const t = (cycleSecond - BALL_PHYSICS_AT) / (BALL_MAGNET_AT - BALL_PHYSICS_AT);
    return {
      ballPhase: 'free',
      cameraMode: 'chase',
      wheelSpinSpeed: 3.2 - t * 0.4,
      timeScale: 1,
      spinProgress: t,
    };
  }
  if (cycleSecond < BALL_SETTLE_AT) {
    const t = (cycleSecond - BALL_MAGNET_AT) / (BALL_SETTLE_AT - BALL_MAGNET_AT);
    return {
      ballPhase: 'guided',
      cameraMode: 'slowmo',
      wheelSpinSpeed: 0.95 + t * 0.1,
      timeScale: 0.55 - t * 0.1,
      spinProgress: t,
      guideStrength: 0.65 + t * 0.35,
    };
  }
  return {
    ballPhase: 'guided',
    cameraMode: 'macro',
    wheelSpinSpeed: 0.85,
    timeScale: 0.4,
    spinProgress: 1,
    guideStrength: 1,
  };
}

export function resolveGameState(clock) {
  const { name, cycleSecond } = clock;

  if (name === 'betting') {
    return { ...GAME_STATES.betting, phaseName: name };
  }
  if (name === 'locked') {
    return { ...GAME_STATES.locked, phaseName: name };
  }
  if (name === 'spinning') {
    return { ...resolveSpinState(cycleSecond), phaseName: name };
  }
  return { ...GAME_STATES.betting, phaseName: name };
}

console.assert(resolveSpinState(25).ballPhase === 'descent', 'descent at 25');
console.assert(resolveSpinState(26).ballPhase === 'free', 'free at 26');
console.assert(resolveSpinState(29).cameraMode === 'macro', 'macro at 29');
